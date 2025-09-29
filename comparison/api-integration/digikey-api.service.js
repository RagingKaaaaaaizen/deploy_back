const axios = require('axios');
const BaseAPIService = require('./base-api.service');

/**
 * Digikey API Service
 * Integrates with Digikey's ProductSearch API for PC hardware parts
 */
class DigikeyAPIService extends BaseAPIService {
    constructor() {
        super('digikey');
        this.baseURL = 'https://api.digikey.com/products/v4';
        this.clientId = 'zfdcFUtZ1wa2NjAv1gEdTi8kz2ymYQ3U8s5AGdjkJkHNw2Of';
        this.clientSecret = 'WyWozn1GUA1FUy8NIxNatTtgOZv8ztGYFT5EhUp8XoQ35oxBD1GccAV0gjukm5Bm';
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    /**
     * Get OAuth access token
     */
    async getAccessToken() {
        try {
            // Check if we have a valid token
            if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
                return this.accessToken;
            }

            // Request new token
            const response = await axios.post('https://api.digikey.com/v1/oauth2/token', {
                grant_type: 'client_credentials',
                client_id: this.clientId,
                client_secret: this.clientSecret
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            this.accessToken = response.data.access_token;
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 minute buffer
            
            return this.accessToken;
        } catch (error) {
            console.error('Digikey API: Failed to get access token:', error.message);
            throw new Error('Failed to authenticate with Digikey API');
        }
    }

    /**
     * Search for parts using Digikey API
     */
    async searchParts(query, category = null, limit = 10) {
        try {
            const token = await this.getAccessToken();
            
            const searchRequest = {
                Keywords: query,
                Limit: Math.min(limit, 50), // Digikey max is 50
                Offset: 0,
                FilterOptionsRequest: {
                    CategoryIds: category ? [this.mapCategoryToDigikeyId(category)] : [],
                    ManufacturerIds: [],
                    ParametricFilters: []
                },
                SortOptions: {
                    Sort: 'Relevance',
                    Direction: 'Ascending',
                    SortParameterId: 0
                }
            };

            const response = await axios.post(`${this.baseURL}/search/keyword`, searchRequest, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-DIGIKEY-Client-Id': this.clientId,
                    'X-DIGIKEY-Locale-Site': 'US',
                    'X-DIGIKEY-Locale-Language': 'en',
                    'X-DIGIKEY-Locale-Currency': 'USD',
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            return this.formatSearchResults(response.data);
        } catch (error) {
            console.error('Digikey API: Search failed:', error.message);
            throw new Error(`Digikey search failed: ${error.message}`);
        }
    }

    /**
     * Get detailed product information
     */
    async getProductDetails(digikeyPartNumber) {
        try {
            const token = await this.getAccessToken();
            
            const response = await axios.get(`${this.baseURL}/products/${digikeyPartNumber}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-DIGIKEY-Client-Id': this.clientId,
                    'X-DIGIKEY-Locale-Site': 'US',
                    'X-DIGIKEY-Locale-Language': 'en',
                    'X-DIGIKEY-Locale-Currency': 'USD'
                },
                timeout: 10000
            });

            return this.formatProductDetails(response.data);
        } catch (error) {
            console.error('Digikey API: Product details failed:', error.message);
            throw new Error(`Digikey product details failed: ${error.message}`);
        }
    }

    /**
     * Map our categories to Digikey category IDs
     */
    mapCategoryToDigikeyId(category) {
        const categoryMap = {
            'cpu': 1, // Processors
            'gpu': 2, // Graphics Cards
            'memory': 3, // Memory
            'storage': 4, // Storage
            'motherboard': 5, // Motherboards
            'power': 6, // Power Supplies
            'case': 7, // Cases
            'cooling': 8, // Cooling
            'network': 9, // Network
            'audio': 10, // Audio
            'monitor': 11, // Displays
            'keyboard': 12, // Keyboards
            'mouse': 13, // Mice
            'other': 14 // Other
        };
        
        return categoryMap[category.toLowerCase()] || 14; // Default to "Other"
    }

    /**
     * Format search results to our standard format
     */
    formatSearchResults(data) {
        if (!data.Products || !Array.isArray(data.Products)) {
            return {
                success: true,
                results: [],
                totalResults: 0,
                searchTime: 0
            };
        }

        const results = data.Products.map(product => ({
            id: product.DigiKeyPartNumber || product.ManufacturerProductNumber,
            name: product.Description?.MarketingInformation || product.Description?.ProductInformation || 'Unknown Product',
            category: this.mapDigikeyCategoryToOurs(product.Category?.Name),
            price: product.UnitPrice || 0,
            specifications: this.extractSpecifications(product),
            provider: 'digikey',
            availability: product.QuantityAvailable > 0 ? 'in_stock' : 'out_of_stock',
            manufacturer: product.Manufacturer?.Name || 'Unknown',
            partNumber: product.ManufacturerProductNumber || product.DigiKeyPartNumber,
            datasheetUrl: product.DatasheetUrl,
            productUrl: product.ProductUrl,
            imageUrl: product.PhotoUrl,
            quantityAvailable: product.QuantityAvailable || 0
        }));

        return {
            success: true,
            results: results,
            totalResults: data.ProductsCount || results.length,
            searchTime: 0
        };
    }

    /**
     * Format product details
     */
    formatProductDetails(data) {
        return {
            success: true,
            product: {
                id: data.DigiKeyPartNumber || data.ManufacturerProductNumber,
                name: data.Description?.MarketingInformation || data.Description?.ProductInformation || 'Unknown Product',
                category: this.mapDigikeyCategoryToOurs(data.Category?.Name),
                price: data.UnitPrice || 0,
                specifications: this.extractSpecifications(data),
                provider: 'digikey',
                availability: data.QuantityAvailable > 0 ? 'in_stock' : 'out_of_stock',
                manufacturer: data.Manufacturer?.Name || 'Unknown',
                partNumber: data.ManufacturerProductNumber || data.DigiKeyPartNumber,
                datasheetUrl: data.DatasheetUrl,
                productUrl: data.ProductUrl,
                imageUrl: data.PhotoUrl,
                quantityAvailable: data.QuantityAvailable || 0
            }
        };
    }

    /**
     * Map Digikey categories to our categories
     */
    mapDigikeyCategoryToOurs(digikeyCategory) {
        if (!digikeyCategory) return 'other';
        
        const categoryMap = {
            'processors': 'cpu',
            'graphics cards': 'gpu',
            'memory': 'memory',
            'storage': 'storage',
            'motherboards': 'motherboard',
            'power supplies': 'power',
            'cases': 'case',
            'cooling': 'cooling',
            'network': 'network',
            'audio': 'audio',
            'displays': 'monitor',
            'keyboards': 'keyboard',
            'mice': 'mouse'
        };
        
        const lowerCategory = digikeyCategory.toLowerCase();
        for (const [digikey, ours] of Object.entries(categoryMap)) {
            if (lowerCategory.includes(digikey)) {
                return ours;
            }
        }
        
        return 'other';
    }

    /**
     * Extract specifications from Digikey product data
     */
    extractSpecifications(product) {
        const specs = {};
        
        // Extract from product parameters if available
        if (product.Parameters && Array.isArray(product.Parameters)) {
            product.Parameters.forEach(param => {
                if (param.Parameter && param.Value) {
                    specs[param.Parameter] = param.Value;
                }
            });
        }
        
        // Extract from product variations if available
        if (product.ProductVariations && Array.isArray(product.ProductVariations)) {
            product.ProductVariations.forEach(variation => {
                if (variation.Parameters && Array.isArray(variation.Parameters)) {
                    variation.Parameters.forEach(param => {
                        if (param.Parameter && param.Value) {
                            specs[param.Parameter] = param.Value;
                        }
                    });
                }
            });
        }
        
        // Add basic information
        if (product.Manufacturer?.Name) {
            specs.manufacturer = product.Manufacturer.Name;
        }
        
        if (product.ManufacturerProductNumber) {
            specs.partNumber = product.ManufacturerProductNumber;
        }
        
        if (product.UnitPrice) {
            specs.price = product.UnitPrice;
        }
        
        return specs;
    }

    /**
     * Check API health
     */
    async checkHealth() {
        try {
            await this.getAccessToken();
            return {
                status: 'healthy',
                provider: 'digikey',
                lastChecked: new Date().toISOString(),
                responseTime: 0
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                provider: 'digikey',
                lastChecked: new Date().toISOString(),
                error: error.message
            };
        }
    }
}

module.exports = DigikeyAPIService;
