const axios = require('axios');
const BaseAPIService = require('./base-api.service');

/**
 * Oxylabs Web Scraper API Service
 * Integrates with Oxylabs.io for web scraping PC hardware from Amazon, Newegg, etc.
 */
class OxylabsAPIService extends BaseAPIService {
    constructor() {
        super('oxylabs');
        this.baseURL = 'https://realtime.oxylabs.io/v1/queries';
        this.username = 'Arima_J5qyd';
        this.password = 'aP+EGvJQ5a6UFu4';
        this.geoLocation = '90210'; // US location for better results
    }

    /**
     * Search for PC parts using web scraping
     * @param {string} query - Search query or product ID
     * @param {string} category - Part category
     * @param {number} limit - Result limit
     * @returns {Promise<Array>} Search results
     */
    async searchParts(query, category = null, limit = 10) {
        try {
            const cacheKey = `oxylabs_search_${query}_${category}_${limit}`;
            
            // Check cache first (if database is available)
            try {
                const cached = await this.getCachedData(cacheKey);
                if (cached) {
                    return cached;
                }
            } catch (cacheError) {
                console.log('Cache not available, proceeding without cache');
            }

            // Determine the best scraping source based on query type
            const scrapingRequest = this.buildScrapingRequest(query, category, limit);
            
            const response = await axios.post(this.baseURL, scrapingRequest, {
                auth: {
                    username: this.username,
                    password: this.password
                },
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 seconds timeout for scraping
            });

            const results = this.parseScrapingResults(response.data, limit);
            
            // Cache for 6 hours (scraping results change frequently) - if database is available
            try {
                await this.cacheData(cacheKey, results, 6);
            } catch (cacheError) {
                console.log('Cache not available, skipping cache storage');
            }

            return results;

        } catch (error) {
            console.error('Oxylabs scraping error:', error.message);
            throw new Error(`Oxylabs scraping failed: ${error.message}`);
        }
    }

    /**
     * Get product details by scraping
     * @param {string} productId - Product ID or URL
     * @returns {Promise<Object>} Product details
     */
    async getProductDetails(productId) {
        try {
            const cacheKey = `oxylabs_product_${productId}`;
            
            // Check cache first (if database is available)
            try {
                const cached = await this.getCachedData(cacheKey);
                if (cached) {
                    return cached;
                }
            } catch (cacheError) {
                console.log('Cache not available, proceeding without cache');
            }

            // Build scraping request for specific product
            const scrapingRequest = {
                source: "amazon_product",
                query: productId,
                geo_location: this.geoLocation,
                parse: true,
                context: [
                    {
                        key: "key",
                        value: "value"
                    }
                ]
            };

            const response = await axios.post(this.baseURL, scrapingRequest, {
                auth: {
                    username: this.username,
                    password: this.password
                },
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            const productDetails = this.parseProductDetails(response.data);
            
            // Cache for 12 hours (product details are more stable) - if database is available
            try {
                await this.cacheData(cacheKey, productDetails, 12);
            } catch (cacheError) {
                console.log('Cache not available, skipping cache storage');
            }

            return productDetails;

        } catch (error) {
            console.error('Oxylabs product details error:', error.message);
            throw new Error(`Oxylabs product details failed: ${error.message}`);
        }
    }

    /**
     * Build scraping request based on query type
     * @param {string} query - Search query
     * @param {string} category - Part category
     * @param {number} limit - Result limit
     * @returns {Object} Scraping request configuration
     */
    buildScrapingRequest(query, category, limit = 10) {
        // Check if query looks like an Amazon product ID
        if (this.isAmazonProductId(query)) {
            return {
                source: "amazon_product",
                query: query,
                geo_location: this.geoLocation,
                parse: true
            };
        }

        // Check if query is a URL
        if (this.isUrl(query)) {
            return {
                source: "universal",
                url: query,
                geo_location: this.geoLocation,
                parse: true
            };
        }

        // For search queries, use Amazon search
        return {
            source: "amazon_search",
            query: this.buildSearchQuery(query, category),
            geo_location: this.geoLocation,
            parse: true,
            pages: Math.min(Math.ceil(limit / 16), 3) // Amazon shows 16 results per page
        };
    }

    /**
     * Check if query is an Amazon product ID
     * @param {string} query - Query string
     * @returns {boolean} True if looks like Amazon product ID
     */
    isAmazonProductId(query) {
        // Amazon product IDs are typically 10 characters, alphanumeric
        return /^[A-Z0-9]{10}$/.test(query) || /^B[A-Z0-9]{9}$/.test(query);
    }

    /**
     * Check if query is a URL
     * @param {string} query - Query string
     * @returns {boolean} True if looks like URL
     */
    isUrl(query) {
        return /^https?:\/\//.test(query);
    }

    /**
     * Build search query with category context
     * @param {string} query - Base query
     * @param {string} category - Part category
     * @returns {string} Enhanced search query
     */
    buildSearchQuery(query, category) {
        let searchQuery = query;
        
        // Add category context to improve results
        if (category) {
            const categoryTerms = {
                'cpu': 'processor',
                'gpu': 'graphics card',
                'memory': 'RAM memory',
                'storage': 'SSD hard drive',
                'motherboard': 'motherboard',
                'power': 'power supply PSU',
                'case': 'computer case',
                'monitor': 'monitor display',
                'keyboard': 'keyboard',
                'mouse': 'mouse'
            };
            
            if (categoryTerms[category]) {
                searchQuery = `${searchQuery} ${categoryTerms[category]}`;
            }
        }
        
        return searchQuery;
    }

    /**
     * Parse scraping results into our standard format
     * @param {Object} responseData - Raw response from Oxylabs
     * @param {number} limit - Result limit
     * @returns {Object} Formatted results
     */
    parseScrapingResults(responseData, limit) {
        try {
            const results = [];
            
            if (responseData.results && Array.isArray(responseData.results)) {
                for (const result of responseData.results.slice(0, limit)) {
                    if (result.content) {
                        const parsedContent = this.parseContent(result.content);
                        if (parsedContent) {
                            results.push(parsedContent);
                        }
                    }
                }
            }

            return {
                success: true,
                results: results,
                totalResults: results.length,
                searchTime: responseData.response_time || 0,
                provider: 'oxylabs'
            };

        } catch (error) {
            console.error('Error parsing Oxylabs results:', error);
            return {
                success: false,
                results: [],
                totalResults: 0,
                searchTime: 0,
                provider: 'oxylabs',
                error: error.message
            };
        }
    }

    /**
     * Parse individual content item
     * @param {Object} content - Content from Oxylabs
     * @returns {Object|null} Parsed product data
     */
    parseContent(content) {
        try {
            // Handle different response formats
            let productData = null;
            
            if (content.product) {
                // Amazon product format
                productData = this.parseAmazonProduct(content.product);
            } else if (content.search_results && Array.isArray(content.search_results) && content.search_results.length > 0) {
                // Amazon search results format
                productData = this.parseAmazonSearchResult(content.search_results[0]);
            } else if (content.results && Array.isArray(content.results) && content.results.length > 0) {
                // Generic search results format
                productData = this.parseGenericResult(content.results[0]);
            } else if (content.title || content.name) {
                // Direct product data
                productData = this.parseDirectProduct(content);
            } else {
                console.log('Unknown content format:', Object.keys(content));
                return null;
            }

            return productData;

        } catch (error) {
            console.error('Error parsing content:', error);
            return null;
        }
    }

    /**
     * Parse Amazon product data
     * @param {Object} product - Amazon product data
     * @returns {Object} Formatted product
     */
    parseAmazonProduct(product) {
        return {
            id: product.asin || product.product_id || `oxylabs_${Date.now()}`,
            name: product.title || product.name || 'Unknown Product',
            category: this.determineCategory(product.title || product.name),
            price: this.parsePrice(product.price),
            specifications: this.parseSpecifications(product),
            provider: 'oxylabs',
            availability: product.availability || 'in_stock',
            manufacturer: this.extractManufacturer(product.title || product.name),
            partNumber: product.asin || product.model_number,
            productUrl: product.url || product.product_url,
            imageUrl: product.image_url || product.thumbnail,
            description: product.description || product.features?.join(', '),
            rating: product.rating || product.stars,
            reviewCount: product.reviews_count || product.total_reviews
        };
    }

    /**
     * Parse Amazon search result
     * @param {Object} searchResult - Amazon search result
     * @returns {Object} Formatted product
     */
    parseAmazonSearchResult(searchResult) {
        return {
            id: searchResult.asin || `oxylabs_${Date.now()}`,
            name: searchResult.title || 'Unknown Product',
            category: this.determineCategory(searchResult.title),
            price: this.parsePrice(searchResult.price),
            specifications: this.parseSpecifications(searchResult),
            provider: 'oxylabs',
            availability: searchResult.availability || 'in_stock',
            manufacturer: this.extractManufacturer(searchResult.title),
            partNumber: searchResult.asin,
            productUrl: searchResult.url,
            imageUrl: searchResult.image_url || searchResult.thumbnail,
            description: searchResult.description,
            rating: searchResult.rating || searchResult.stars,
            reviewCount: searchResult.reviews_count
        };
    }

    /**
     * Parse generic result data
     * @param {Object} result - Generic result data
     * @returns {Object} Formatted product
     */
    parseGenericResult(result) {
        if (!result) return null;
        
        return {
            id: result.id || `oxylabs_${Date.now()}`,
            name: result.title || result.name || 'Unknown Product',
            category: this.determineCategory(result.title || result.name),
            price: this.parsePrice(result.price),
            specifications: this.parseSpecifications(result),
            provider: 'oxylabs',
            availability: result.availability || 'in_stock',
            manufacturer: this.extractManufacturer(result.title || result.name),
            partNumber: result.sku || result.model,
            productUrl: result.url,
            imageUrl: result.image,
            description: result.description
        };
    }

    /**
     * Parse direct product data
     * @param {Object} product - Direct product data
     * @returns {Object} Formatted product
     */
    parseDirectProduct(product) {
        return {
            id: product.asin || product.id || `oxylabs_${Date.now()}`,
            name: product.title || product.name || 'Unknown Product',
            category: this.determineCategory(product.title || product.name),
            price: this.parsePrice(product.price),
            specifications: this.parseSpecifications(product),
            provider: 'oxylabs',
            availability: product.availability || 'in_stock',
            manufacturer: this.extractManufacturer(product.title || product.name),
            partNumber: product.asin || product.sku || product.model,
            productUrl: product.url || product.product_url,
            imageUrl: product.image_url || product.image || product.thumbnail,
            description: product.description,
            rating: product.rating || product.stars,
            reviewCount: product.reviews_count || product.total_reviews
        };
    }

    /**
     * Determine product category from title/name
     * @param {string} title - Product title
     * @returns {string} Category
     */
    determineCategory(title) {
        if (!title) return 'other';
        
        const titleLower = title.toLowerCase();
        
        if (titleLower.includes('processor') || titleLower.includes('cpu') || titleLower.includes('intel') || titleLower.includes('amd ryzen')) {
            return 'cpu';
        }
        if (titleLower.includes('graphics card') || titleLower.includes('gpu') || titleLower.includes('rtx') || titleLower.includes('radeon')) {
            return 'gpu';
        }
        if (titleLower.includes('memory') || titleLower.includes('ram') || titleLower.includes('ddr4') || titleLower.includes('ddr5')) {
            return 'memory';
        }
        if (titleLower.includes('ssd') || titleLower.includes('hard drive') || titleLower.includes('storage') || titleLower.includes('nvme')) {
            return 'storage';
        }
        if (titleLower.includes('motherboard') || titleLower.includes('mainboard')) {
            return 'motherboard';
        }
        if (titleLower.includes('power supply') || titleLower.includes('psu')) {
            return 'power';
        }
        if (titleLower.includes('case') || titleLower.includes('chassis')) {
            return 'case';
        }
        if (titleLower.includes('monitor') || titleLower.includes('display') || titleLower.includes('screen')) {
            return 'monitor';
        }
        
        return 'other';
    }

    /**
     * Parse price from various formats
     * @param {string|number} price - Raw price data
     * @returns {number} Parsed price
     */
    parsePrice(price) {
        if (typeof price === 'number') return price;
        if (typeof price === 'string') {
            // Remove currency symbols and extract number
            const match = price.match(/[\d,]+\.?\d*/);
            if (match) {
                return parseFloat(match[0].replace(/,/g, ''));
            }
        }
        return 0;
    }

    /**
     * Extract manufacturer from product title
     * @param {string} title - Product title
     * @returns {string} Manufacturer name
     */
    extractManufacturer(title) {
        if (!title) return 'Unknown';
        
        const manufacturers = ['Intel', 'AMD', 'NVIDIA', 'Samsung', 'Corsair', 'ASUS', 'MSI', 'Gigabyte', 'EVGA', 'Western Digital', 'Seagate', 'Kingston', 'G.Skill', 'Dell', 'HP', 'Lenovo'];
        
        for (const manufacturer of manufacturers) {
            if (title.toLowerCase().includes(manufacturer.toLowerCase())) {
                return manufacturer;
            }
        }
        
        return 'Unknown';
    }

    /**
     * Parse specifications from product data
     * @param {Object} product - Product data
     * @returns {Object} Specifications object
     */
    parseSpecifications(product) {
        const specs = {};
        
        // Extract common specifications
        if (product.specifications) {
            Object.assign(specs, product.specifications);
        }
        
        if (product.features) {
            specs.features = Array.isArray(product.features) ? product.features : [product.features];
        }
        
        if (product.dimensions) {
            specs.dimensions = product.dimensions;
        }
        
        if (product.weight) {
            specs.weight = product.weight;
        }
        
        return specs;
    }

    /**
     * Parse product details response
     * @param {Object} responseData - Raw response from Oxylabs
     * @returns {Object} Formatted product details
     */
    parseProductDetails(responseData) {
        try {
            if (responseData.results && responseData.results.length > 0) {
                const content = responseData.results[0].content;
                if (content && content.product) {
                    return this.parseAmazonProduct(content.product);
                }
            }
            
            throw new Error('No product data found in response');
            
        } catch (error) {
            console.error('Error parsing product details:', error);
            throw new Error(`Failed to parse product details: ${error.message}`);
        }
    }

    /**
     * Check if service is available
     * @returns {boolean} Service availability
     */
    isAvailable() {
        return !!(this.username && this.password);
    }
}

module.exports = OxylabsAPIService;
