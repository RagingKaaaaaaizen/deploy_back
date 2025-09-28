const axios = require('axios');
const db = require('../../_helpers/db');

/**
 * Base API service class with common functionality for all API integrations
 */
class BaseAPIService {
    constructor(providerName, baseURL, rateLimit = 1000) {
        this.providerName = providerName;
        this.baseURL = baseURL;
        this.rateLimit = rateLimit; // milliseconds between requests
        this.lastRequestTime = 0;
        
        // Create axios instance with default config
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 10000,
            headers: {
                'User-Agent': 'ComputerLab-Inventory/1.0 (PC Parts Comparison)',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        // Add request interceptor for rate limiting
        this.client.interceptors.request.use(this.rateLimitInterceptor.bind(this));
        
        // Add response interceptor for error handling
        this.client.interceptors.response.use(
            response => response,
            this.errorInterceptor.bind(this)
        );
    }

    /**
     * Rate limiting interceptor
     * @param {Object} config - Axios request config
     * @returns {Promise<Object>} Modified config
     */
    async rateLimitInterceptor(config) {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.rateLimit) {
            const delay = this.rateLimit - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        this.lastRequestTime = Date.now();
        return config;
    }

    /**
     * Error handling interceptor
     * @param {Error} error - Axios error
     * @returns {Promise<Error>} Processed error
     */
    async errorInterceptor(error) {
        const errorInfo = {
            provider: this.providerName,
            status: error.response?.status,
            statusText: error.response?.statusText,
            message: error.message,
            url: error.config?.url,
            timestamp: new Date().toISOString()
        };

        console.error(`API Error [${this.providerName}]:`, errorInfo);

        // Handle specific error cases
        if (error.response?.status === 429) {
            throw new Error(`Rate limit exceeded for ${this.providerName}. Please try again later.`);
        } else if (error.response?.status === 404) {
            throw new Error(`Resource not found on ${this.providerName}`);
        } else if (error.response?.status >= 500) {
            throw new Error(`Server error on ${this.providerName}. Please try again later.`);
        }

        throw error;
    }

    /**
     * Check cache for existing data
     * @param {string} identifier - Unique identifier for the part
     * @returns {Promise<Object|null>} Cached data or null
     */
    async getCachedData(identifier) {
        try {
            const cache = await db.ApiCache.findOne({
                where: {
                    partIdentifier: identifier,
                    apiProvider: this.providerName,
                    expiresAt: {
                        [db.Sequelize.Op.gt]: new Date()
                    }
                }
            });

            if (cache) {
                console.log(`Cache hit for ${identifier} on ${this.providerName}`);
                return cache.cachedData;
            }

            return null;
        } catch (error) {
            console.error('Error getting cached data:', error);
            return null;
        }
    }

    /**
     * Cache API response
     * @param {string} identifier - Unique identifier for the part
     * @param {Object} data - Data to cache
     * @param {number} ttlHours - Time to live in hours
     * @returns {Promise<void>}
     */
    async cacheData(identifier, data, ttlHours = 24) {
        try {
            const expiresAt = new Date(Date.now() + (ttlHours * 60 * 60 * 1000));
            
            await db.ApiCache.upsert({
                partIdentifier: identifier,
                apiProvider: this.providerName,
                cachedData: data,
                expiresAt: expiresAt
            });

            console.log(`Cached data for ${identifier} on ${this.providerName} (expires: ${expiresAt})`);
        } catch (error) {
            console.error('Error caching data:', error);
            // Don't throw error for caching failures
        }
    }

    /**
     * Search for parts (to be implemented by subclasses)
     * @param {string} query - Search query
     * @param {string} category - Part category
     * @param {number} limit - Result limit
     * @returns {Promise<Array>} Search results
     */
    async searchParts(query, category = null, limit = 10) {
        throw new Error('searchParts method must be implemented by subclass');
    }

    /**
     * Get part details (to be implemented by subclasses)
     * @param {string} partId - Part identifier
     * @returns {Promise<Object>} Part details
     */
    async getPartDetails(partId) {
        throw new Error('getPartDetails method must be implemented by subclass');
    }

    /**
     * Extract specifications from part data (to be implemented by subclasses)
     * @param {Object} partData - Raw part data from API
     * @returns {Object} Extracted specifications
     */
    extractSpecifications(partData) {
        throw new Error('extractSpecifications method must be implemented by subclass');
    }

    /**
     * Normalize part data to common format
     * @param {Object} rawData - Raw data from API
     * @returns {Object} Normalized part data
     */
    normalizePartData(rawData) {
        return {
            id: rawData.id || null,
            name: rawData.name || rawData.title || 'Unknown',
            brand: rawData.brand || rawData.manufacturer || 'Unknown',
            model: rawData.model || rawData.modelNumber || null,
            category: rawData.category || 'Unknown',
            price: parseFloat(rawData.price) || null,
            currency: rawData.currency || 'USD',
            image: rawData.image || rawData.imageUrl || null,
            url: rawData.url || rawData.link || null,
            specifications: this.extractSpecifications(rawData),
            source: this.providerName,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Make HTTP request with retry logic
     * @param {string} method - HTTP method
     * @param {string} url - Request URL
     * @param {Object} config - Request config
     * @param {number} maxRetries - Maximum number of retries
     * @returns {Promise<Object>} Response data
     */
    async makeRequest(method, url, config = {}, maxRetries = 3) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await this.client.request({
                    method,
                    url,
                    ...config
                });
                
                return response.data;
            } catch (error) {
                lastError = error;
                
                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                    console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms delay`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Clean expired cache entries
     * @returns {Promise<number>} Number of deleted entries
     */
    async cleanExpiredCache() {
        try {
            const result = await db.ApiCache.destroy({
                where: {
                    apiProvider: this.providerName,
                    expiresAt: {
                        [db.Sequelize.Op.lt]: new Date()
                    }
                }
            });

            console.log(`Cleaned ${result} expired cache entries for ${this.providerName}`);
            return result;
        } catch (error) {
            console.error('Error cleaning expired cache:', error);
            return 0;
        }
    }

    /**
     * Get cache statistics
     * @returns {Promise<Object>} Cache statistics
     */
    async getCacheStats() {
        try {
            const stats = await db.ApiCache.findAll({
                where: { apiProvider: this.providerName },
                attributes: [
                    [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'totalEntries'],
                    [db.Sequelize.fn('COUNT', db.Sequelize.literal('CASE WHEN expiresAt > NOW() THEN 1 END')), 'validEntries'],
                    [db.Sequelize.fn('COUNT', db.Sequelize.literal('CASE WHEN expiresAt <= NOW() THEN 1 END')), 'expiredEntries']
                ],
                raw: true
            });

            return stats[0] || { totalEntries: 0, validEntries: 0, expiredEntries: 0 };
        } catch (error) {
            console.error('Error getting cache stats:', error);
            return { totalEntries: 0, validEntries: 0, expiredEntries: 0 };
        }
    }
}

module.exports = BaseAPIService;
