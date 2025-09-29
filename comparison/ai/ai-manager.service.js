const OpenAIService = require('./openai.service');
const LocalLLMService = require('./local-llm.service');
const GeminiService = require('./gemini.service');
const db = require('../../_helpers/db');

/**
 * AI Manager service that coordinates between different AI providers
 * Provides fallback mechanisms and manages AI service availability
 */
class AIManagerService {
    constructor() {
        this.providers = new Map();
        this.providerPriorities = [];
        this.isInitialized = false;
        
        this.initializeProviders();
    }

    /**
     * Initialize AI providers
     */
    initializeProviders() {
        try {
            // Add providers in order of priority
            this.addProvider('gemini', new GeminiService(), 1); // Primary AI service (free tier)
            this.addProvider('openai', new OpenAIService(), 2); // Secondary AI service
            this.addProvider('local-llm', new LocalLLMService(), 3); // Local fallback
            
            this.isInitialized = true;
            console.log('AI Manager initialized with providers:', Array.from(this.providers.keys()));
            
        } catch (error) {
            console.error('Error initializing AI providers:', error);
            this.isInitialized = false;
        }
    }

    /**
     * Add an AI provider
     * @param {string} name - Provider name
     * @param {Object} provider - Provider instance
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
     * Generate AI comparison using the best available provider
     * @param {Object} part1 - First part data
     * @param {Object} part2 - Second part data
     * @param {Object} comparisonResult - Technical comparison results
     * @param {string} providerHint - Hint for which provider to try first
     * @returns {Promise<Object>} AI-generated comparison
     */
    async generateComparison(part1, part2, comparisonResult, providerHint = null) {
        if (!this.isInitialized) {
            throw new Error('AI Manager not initialized');
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

                // Check if provider is available
                if (!provider.service.isAvailable()) {
                    console.log(`Provider ${providerName} not available, skipping`);
                    continue;
                }

                console.log(`Generating comparison with ${providerName}`);
                
                const startTime = Date.now();
                const result = await provider.service.generateComparison(part1, part2, comparisonResult);
                const duration = Date.now() - startTime;
                
                this.updateProviderStats(providerName, true, duration);
                
                // Add metadata to result
                result.aiProvider = providerName;
                result.processingTime = duration;
                
                return result;

            } catch (error) {
                console.error(`Error with AI provider ${providerName}:`, error.message);
                this.updateProviderStats(providerName, false);
            }
        }

        // If all providers fail, return basic comparison
        return this.generateBasicComparison(part1, part2, comparisonResult);
    }

    /**
     * Generate specification explanation using AI
     * @param {Object} part - Part data
     * @param {string} category - Part category
     * @param {string} providerHint - Provider hint
     * @returns {Promise<string>} AI explanation
     */
    async explainSpecifications(part, category, providerHint = null) {
        if (!this.isInitialized) {
            return this.generateBasicExplanation(part, category);
        }

        // Try provider hint first if provided
        let providersToTry = this.providerPriorities;
        if (providerHint && this.providers.has(providerHint)) {
            providersToTry = [providerHint, ...this.providerPriorities.filter(p => p !== providerHint)];
        }

        for (const providerName of providersToTry) {
            try {
                const provider = this.providers.get(providerName);
                if (!provider || !provider.isHealthy || !provider.service.isAvailable()) {
                    continue;
                }

                console.log(`Explaining specifications with ${providerName}`);
                
                const explanation = await provider.service.explainSpecifications(part, category);
                
                this.updateProviderStats(providerName, true);
                
                return explanation;

            } catch (error) {
                console.error(`Error explaining with ${providerName}:`, error.message);
                this.updateProviderStats(providerName, false);
            }
        }

        return this.generateBasicExplanation(part, category);
    }

    /**
     * Generate upgrade recommendation using AI
     * @param {Object} currentPart - Current part
     * @param {Array} availableParts - Available upgrades
     * @param {string} useCase - Use case
     * @param {string} providerHint - Provider hint
     * @returns {Promise<Object>} AI recommendation
     */
    async generateUpgradeRecommendation(currentPart, availableParts, useCase, providerHint = null) {
        if (!this.isInitialized) {
            return this.generateBasicUpgradeRecommendation(currentPart, availableParts, useCase);
        }

        // Try provider hint first if provided
        let providersToTry = this.providerPriorities;
        if (providerHint && this.providers.has(providerHint)) {
            providersToTry = [providerHint, ...this.providerPriorities.filter(p => p !== providerHint)];
        }

        for (const providerName of providersToTry) {
            try {
                const provider = this.providers.get(providerName);
                if (!provider || !provider.isHealthy || !provider.service.isAvailable()) {
                    continue;
                }

                console.log(`Generating upgrade recommendation with ${providerName}`);
                
                const recommendation = await provider.service.generateUpgradeRecommendation(currentPart, availableParts, useCase);
                
                this.updateProviderStats(providerName, true);
                
                return {
                    ...recommendation,
                    aiProvider: providerName
                };

            } catch (error) {
                console.error(`Error generating upgrade recommendation with ${providerName}:`, error.message);
                this.updateProviderStats(providerName, false);
            }
        }

        return this.generateBasicUpgradeRecommendation(currentPart, availableParts, useCase);
    }

    /**
     * Generate basic comparison without AI
     * @param {Object} part1 - First part
     * @param {Object} part2 - Second part
     * @param {Object} comparisonResult - Technical comparison
     * @returns {Object} Basic comparison data
     */
    generateBasicComparison(part1, part2, comparisonResult) {
        const differences = [];
        
        if (comparisonResult && comparisonResult.differences) {
            comparisonResult.differences.forEach(diff => {
                if (diff.winner !== 'tie') {
                    differences.push(`${diff.spec}: ${diff.winner === 'part1' ? part1.name : part2.name} is better`);
                }
            });
        }

        return {
            summary: `Comparing ${part1.brand} ${part1.name} with ${part2.brand} ${part2.name}. Both are ${part1.category} components.`,
            recommendation: comparisonResult?.winner || 'tie',
            confidence: 0.3,
            keyDifferences: differences.length > 0 ? differences : ['Similar performance overall'],
            aiExplanation: 'AI analysis unavailable - using basic comparison',
            aiProvider: 'none',
            processingTime: 0
        };
    }

    /**
     * Generate basic explanation without AI
     * @param {Object} part - Part data
     * @param {string} category - Part category
     * @returns {string} Basic explanation
     */
    generateBasicExplanation(part, category) {
        return `The ${part.brand} ${part.name} is a ${category} component. AI-powered explanation is currently unavailable. Please refer to the technical specifications for detailed information.`;
    }

    /**
     * Generate basic upgrade recommendation without AI
     * @param {Object} currentPart - Current part
     * @param {Array} availableParts - Available parts
     * @param {string} useCase - Use case
     * @returns {Object} Basic recommendation
     */
    generateBasicUpgradeRecommendation(currentPart, availableParts, useCase) {
        return {
            recommendedPart: 0,
            reason: `AI-powered upgrade analysis is unavailable. Consider comparing specifications manually for ${useCase}.`,
            improvement: 'Manual comparison recommended',
            costBenefit: 'Evaluate cost vs performance improvement manually',
            alternatives: availableParts.slice(0, 2).map((part, index) => `Option ${index + 1}: ${part.brand} ${part.name}`),
            aiProvider: 'none'
        };
    }

    /**
     * Update provider statistics
     * @param {string} providerName - Provider name
     * @param {boolean} success - Whether the operation was successful
     * @param {number} duration - Processing duration in ms
     */
    updateProviderStats(providerName, success, duration = 0) {
        const provider = this.providers.get(providerName);
        if (!provider) return;

        if (success) {
            provider.successCount++;
            provider.errorCount = Math.max(0, provider.errorCount - 1);
            provider.isHealthy = true;
            provider.averageResponseTime = provider.averageResponseTime 
                ? (provider.averageResponseTime + duration) / 2 
                : duration;
        } else {
            provider.errorCount++;
            provider.successCount = Math.max(0, provider.successCount - 1);
            
            // Mark as unhealthy if too many errors
            if (provider.errorCount > 3) {
                provider.isHealthy = false;
                console.warn(`AI provider ${providerName} marked as unhealthy due to ${provider.errorCount} errors`);
            }
        }

        provider.lastUsed = new Date();
    }

    /**
     * Get AI provider statistics
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
                averageResponseTime: provider.averageResponseTime || 0,
                successRate: provider.successCount + provider.errorCount > 0 
                    ? (provider.successCount / (provider.successCount + provider.errorCount)) * 100 
                    : 0,
                isAvailable: provider.service.isAvailable ? provider.service.isAvailable() : false
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
                console.log(`Reset health status for AI provider: ${providerName}`);
            }
        } else {
            for (const [name, provider] of this.providers) {
                provider.isHealthy = true;
                provider.errorCount = 0;
            }
            console.log('Reset health status for all AI providers');
        }
    }

    /**
     * Check if any AI provider is available
     * @returns {boolean} True if at least one provider is available
     */
    isAnyProviderAvailable() {
        return Array.from(this.providers.values()).some(provider => 
            provider.isHealthy && provider.service.isAvailable && provider.service.isAvailable()
        );
    }

    /**
     * Get available AI providers
     * @returns {Array} List of available provider names
     */
    getAvailableProviders() {
        return Array.from(this.providers.entries())
            .filter(([name, provider]) => provider.isHealthy && provider.service.isAvailable && provider.service.isAvailable())
            .map(([name]) => name);
    }

    /**
     * Configure AI provider
     * @param {string} providerName - Provider name
     * @param {Object} config - Configuration object
     */
    configureProvider(providerName, config) {
        const provider = this.providers.get(providerName);
        if (provider && provider.service.setConfig) {
            provider.service.setConfig(config);
            console.log(`Configured AI provider: ${providerName}`);
        }
    }

    /**
     * Get overall AI service status
     * @returns {Object} Overall status information
     */
    getStatus() {
        const availableProviders = this.getAvailableProviders();
        
        return {
            isInitialized: this.isInitialized,
            totalProviders: this.providers.size,
            availableProviders: availableProviders.length,
            providerNames: availableProviders,
            hasAnyProvider: this.isAnyProviderAvailable(),
            providerStats: this.getProviderStats()
        };
    }
}

// Create singleton instance
const aiManager = new AIManagerService();

module.exports = aiManager;
