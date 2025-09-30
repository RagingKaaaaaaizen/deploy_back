const MockAPIService = require('./mock-api.service');
const DigikeyAPIService = require('./digikey-api.service');
const OxylabsAPIService = require('./oxylabs-api.service');
const db = require('../../_helpers/db');

/**
 * API Manager service that coordinates between different API providers
 * Provides fallback mechanisms and load balancing
 */
class APIManagerService {
    constructor() {
        this.providers = new Map();
        this.providerPriorities = [];
        this.isInitialized = false;
        
        this.initializeProviders();
    }

    /**
     * Initialize API providers
     */
    initializeProviders() {
        try {
            // Add providers in order of priority
            this.addProvider('mock', new MockAPIService(), 1); // Primary provider (Enhanced testing data)
            this.addProvider('oxylabs', new OxylabsAPIService(), 2); // Secondary web scraper (Amazon, Newegg, etc.)
            this.addProvider('digikey', new DigikeyAPIService(), 3); // Tertiary API provider (Electronic components)
            
            // Future providers can be added here
            // this.addProvider('amazon', new AmazonAPIService(), 4);
            // this.addProvider('newegg', new NeweggAPIService(), 5);
            
            this.isInitialized = true;
            console.log('API Manager initialized with providers:', Array.from(this.providers.keys()));
            
        } catch (error) {
            console.error('Error initializing API providers:', error);
            this.isInitialized = false;
        }
    }

    /**
     * Add an API provider
     * @param {string} name - Provider name
     * @param {BaseAPIService} provider - Provider instance
     * @param {number} priority - Priority (lower number = higher priority)
     */
    addProvider(name, provider, priority = 999) {
        this.providers.set(name, {
            service: provider,
            priority: priority,
            isHealthy: true,
            lastUsed: null,
            errorCount: 0,
            successCount: 0
        });

        // Sort providers by priority
        this.providerPriorities = Array.from(this.providers.entries())
            .sort((a, b) => a[1].priority - b[1].priority)
            .map(([name]) => name);
    }

    /**
     * Search for parts across all providers
     * @param {string} query - Search query
     * @param {string} category - Part category
     * @param {number} limit - Result limit per provider
     * @param {Object} options - Search options
     * @returns {Promise<Array>} Combined search results
     */
    async searchParts(query, category = null, limit = 10, options = {}) {
        if (!this.isInitialized) {
            throw new Error('API Manager not initialized');
        }

        const { 
            providers = null, // Specific providers to use
            maxProviders = 2, // Maximum number of providers to try
            timeout = 10000, // Timeout per provider
            deduplicate = true // Remove duplicate results
        } = options;

        const results = [];
        const errors = [];
        const providersToUse = providers || this.providerPriorities.slice(0, maxProviders);

        // Try each provider
        for (const providerName of providersToUse) {
            try {
                const provider = this.providers.get(providerName);
                if (!provider || !provider.isHealthy) {
                    console.log(`Skipping unhealthy provider: ${providerName}`);
                    continue;
                }

                console.log(`Searching ${providerName} for: ${query}`);
                
                // Create timeout promise
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error(`Provider ${providerName} timeout`)), timeout);
                });

                // Search with timeout
                const searchPromise = provider.service.searchParts(query, category, limit);
                const providerResults = await Promise.race([searchPromise, timeoutPromise]);

                if (providerResults && providerResults.length > 0) {
                    results.push(...providerResults);
                    this.updateProviderStats(providerName, true);
                    console.log(`✅ ${providerName} returned ${providerResults.length} results`);
                } else {
                    console.log(`⚠️ ${providerName} returned no results`);
                }

                // Break if we have enough results
                if (results.length >= limit && !options.continueOnLimit) {
                    break;
                }

            } catch (error) {
                console.error(`❌ Error with provider ${providerName}:`, error.message);
                this.updateProviderStats(providerName, false);
                errors.push({ provider: providerName, error: error.message });
            }
        }

        // Deduplicate results if requested
        let finalResults = results;
        if (deduplicate) {
            finalResults = this.deduplicateResults(results);
        }

        // Limit final results
        finalResults = finalResults.slice(0, limit);

        // Log summary
        console.log(`Search completed: ${finalResults.length} results from ${results.length} total, ${errors.length} errors`);

        return {
            results: finalResults,
            errors: errors,
            providers: providersToUse,
            totalFound: results.length,
            duplicatesRemoved: results.length - finalResults.length
        };
    }

    /**
     * Get part details from the best available provider
     * @param {string} partId - Part identifier
     * @param {string} providerHint - Hint for which provider to try first
     * @returns {Promise<Object>} Part details
     */
    async getPartDetails(partId, providerHint = null) {
        if (!this.isInitialized) {
            throw new Error('API Manager not initialized');
        }

        // Try provider hint first if provided
        let providersToTry = this.providerPriorities;
        if (providerHint && this.providers.has(providerHint)) {
            providersToTry = [providerHint, ...this.providerPriorities.filter(p => p !== providerHint)];
        }

        for (const providerName of providersToTry) {
            try {
                const provider = this.providers.get(providerName);
                if (!provider || !provider.isHealthy) {
                    continue;
                }

                console.log(`Getting details from ${providerName} for part: ${partId}`);
                
                const details = await provider.service.getPartDetails(partId);
                
                if (details) {
                    this.updateProviderStats(providerName, true);
                    return details;
                }

            } catch (error) {
                console.error(`Error getting details from ${providerName}:`, error.message);
                this.updateProviderStats(providerName, false);
            }
        }

        throw new Error(`Could not find details for part ${partId} in any provider`);
    }

    /**
     * Get specifications for a part
     * @param {string} partId - Part identifier
     * @param {string} providerHint - Provider hint
     * @returns {Promise<Object>} Part specifications
     */
    async getPartSpecifications(partId, providerHint = null) {
        const details = await this.getPartDetails(partId, providerHint);
        return details.specifications || {};
    }

    /**
     * Update part specifications in database
     * @param {number} itemId - Item ID in database
     * @param {string} searchQuery - Search query for finding the part
     * @returns {Promise<Object>} Update result
     */
    async updatePartSpecifications(itemId, searchQuery) {
        try {
            // Get the item from database
            const item = await db.Item.findByPk(itemId, {
                include: [
                    { model: db.Brand, as: 'brand' },
                    { model: db.Category, as: 'category' }
                ]
            });

            if (!item) {
                throw new Error('Item not found in database');
            }

            // Search for the part online with a more flexible query
            let query = searchQuery;
            if (!query) {
                // Avoid duplication by checking if brand name is already in item name
                if (item.name.toLowerCase().includes(item.brand.name.toLowerCase())) {
                    query = item.name;
                } else {
                    query = `${item.brand.name} ${item.name}`;
                }
            }
            console.log(`Searching for: ${query} in category: ${item.category.name}`);
            
            const searchResults = await this.searchParts(query, item.category.name, 5);

            if (searchResults.results.length === 0) {
                // Try a broader search without category filter
                console.log('No results with category filter, trying broader search...');
                const broaderResults = await this.searchParts(query, null, 5);
                
                if (broaderResults.results.length === 0) {
                    // Try with just the item name (remove brand if duplicated)
                    const simpleQuery = item.name;
                    console.log(`Trying simple query: ${simpleQuery}`);
                    const simpleResults = await this.searchParts(simpleQuery, null, 5);
                    
                    if (simpleResults.results.length > 0) {
                        searchResults.results = simpleResults.results;
                    } else {
                        // Try with just the brand name
                        const brandQuery = item.brand.name;
                        console.log(`Trying brand query: ${brandQuery}`);
                        const brandResults = await this.searchParts(brandQuery, null, 5);
                        
                        if (brandResults.results.length > 0) {
                            searchResults.results = brandResults.results;
                        }
                    }
                } else {
                    // Use the broader search results
                    searchResults.results = broaderResults.results;
                }

            if (searchResults.results.length === 0) {
                    // Try to get Mock API data directly as fallback
                    console.log('No search results found, trying Mock API fallback...');
                    const mockService = this.providers.get('mock');
                    if (mockService && mockService.service) {
                        try {
                            const mockResults = await mockService.service.searchParts(query, item.category.name, 1);
                            if (mockResults && mockResults.length > 0) {
                                searchResults.results = mockResults;
                                console.log('Using Mock API fallback data');
                            } else {
                                return {
                                    success: false,
                                    message: 'No matching parts found online',
                                    searchQuery: query,
                                    category: item.category.name
                                };
                            }
                        } catch (mockError) {
                            console.error('Mock API fallback failed:', mockError);
                            return {
                                success: false,
                                message: 'No matching parts found online',
                                searchQuery: query,
                                category: item.category.name
                            };
                        }
                    } else {
                return {
                    success: false,
                            message: 'No matching parts found online',
                            searchQuery: query,
                            category: item.category.name
                };
                    }
                }
            }

            // Get detailed specifications for the first result
            const onlinePart = searchResults.results[0];
            const specifications = await this.getPartSpecifications(onlinePart.id, onlinePart.source);

            // Save specifications to database
            const savedSpecs = [];
            for (const [specName, specData] of Object.entries(specifications)) {
                const spec = await db.PartSpecification.upsert({
                    itemId: itemId,
                    specName: specData.name || specName,
                    specValue: String(specData.value || ''),
                    specUnit: specData.unit || null,
                    source: onlinePart.source,
                    confidence: 0.8,
                    lastUpdated: new Date()
                });

                savedSpecs.push(spec[0]); // upsert returns [instance, created]
            }

            return {
                success: true,
                message: `Updated ${savedSpecs.length} specifications`,
                specifications: savedSpecs,
                source: onlinePart.source,
                onlinePart: onlinePart
            };

        } catch (error) {
            console.error('Error updating part specifications:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Deduplicate search results
     * @param {Array} results - Search results
     * @returns {Array} Deduplicated results
     */
    deduplicateResults(results) {
        const seen = new Map();
        const deduplicated = [];

        for (const result of results) {
            // Create a key based on name and brand
            const key = `${result.name.toLowerCase()}_${result.brand.toLowerCase()}`;
            
            if (!seen.has(key)) {
                seen.set(key, true);
                deduplicated.push(result);
            }
        }

        return deduplicated;
    }

    /**
     * Update provider statistics
     * @param {string} providerName - Provider name
     * @param {boolean} success - Whether the operation was successful
     */
    updateProviderStats(providerName, success) {
        const provider = this.providers.get(providerName);
        if (!provider) return;

        if (success) {
            provider.successCount++;
            provider.errorCount = Math.max(0, provider.errorCount - 1); // Reduce error count on success
            provider.isHealthy = true;
        } else {
            provider.errorCount++;
            provider.successCount = Math.max(0, provider.successCount - 1);
            
            // Mark as unhealthy if too many errors
            if (provider.errorCount > 5) {
                provider.isHealthy = false;
                console.warn(`Provider ${providerName} marked as unhealthy due to ${provider.errorCount} errors`);
            }
        }

        provider.lastUsed = new Date();
    }

    /**
     * Get provider statistics
     * @returns {Object} Provider statistics
     */
    getProviderStats() {
        const stats = {};
        
        for (const [name, provider] of this.providers) {
            stats[name] = {
                priority: provider.priority,
                isHealthy: provider.isHealthy,
                lastUsed: provider.lastUsed,
                errorCount: provider.errorCount,
                successCount: provider.successCount,
                successRate: provider.successCount + provider.errorCount > 0 
                    ? (provider.successCount / (provider.successCount + provider.errorCount)) * 100 
                    : 0
            };
        }

        return stats;
    }

    /**
     * Reset provider health status
     * @param {string} providerName - Provider name (optional, resets all if not provided)
     */
    resetProviderHealth(providerName = null) {
        if (providerName) {
            const provider = this.providers.get(providerName);
            if (provider) {
                provider.isHealthy = true;
                provider.errorCount = 0;
                console.log(`Reset health status for provider: ${providerName}`);
            }
        } else {
            for (const [name, provider] of this.providers) {
                provider.isHealthy = true;
                provider.errorCount = 0;
            }
            console.log('Reset health status for all providers');
        }
    }

    /**
     * Clean expired cache for all providers
     * @returns {Promise<Object>} Cleanup results
     */
    async cleanAllCaches() {
        const results = {};
        
        for (const [name, provider] of this.providers) {
            try {
                const cleaned = await provider.service.cleanExpiredCache();
                results[name] = { cleaned, success: true };
            } catch (error) {
                results[name] = { cleaned: 0, success: false, error: error.message };
            }
        }

        return results;
    }

    /**
     * Get cache statistics for all providers
     * @returns {Promise<Object>} Cache statistics
     */
    async getAllCacheStats() {
        const stats = {};
        
        for (const [name, provider] of this.providers) {
            try {
                const providerStats = await provider.service.getCacheStats();
                stats[name] = providerStats;
            } catch (error) {
                stats[name] = { error: error.message };
            }
        }

        return stats;
    }

    /**
     * Check if any provider is available
     * @returns {boolean} True if at least one provider is healthy
     */
    isAnyProviderAvailable() {
        return Array.from(this.providers.values()).some(provider => provider.isHealthy);
    }

    /**
     * Get available providers
     * @returns {Array} List of healthy provider names
     */
    getAvailableProviders() {
        return Array.from(this.providers.entries())
            .filter(([name, provider]) => provider.isHealthy)
            .map(([name]) => name);
    }
}

// Create singleton instance
const apiManager = new APIManagerService();

module.exports = apiManager;
