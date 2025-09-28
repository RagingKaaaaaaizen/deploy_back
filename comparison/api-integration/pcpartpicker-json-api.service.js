const BaseAPIService = require('./base-api.service');

/**
 * PCPartPicker Unofficial JSON API service
 * Uses the unofficial JSON API instead of HTML scraping
 */
class PCPartPickerJSONAPIService extends BaseAPIService {
    constructor() {
        super('pcpartpicker-json', 'https://api.pcpartpicker.com', 1000); // Faster since it's JSON
        
        // PCPartPicker JSON API category mappings
        this.categoryMappings = {
            'cpu': 'cpu',
            'processor': 'cpu',
            'graphics-card': 'video-card',
            'gpu': 'video-card',
            'memory': 'memory',
            'ram': 'memory',
            'storage': 'internal-hard-drive',
            'hard-drive': 'internal-hard-drive',
            'ssd': 'internal-hard-drive',
            'motherboard': 'motherboard',
            'case': 'case',
            'power-supply': 'power-supply',
            'psu': 'power-supply',
            'monitor': 'monitor',
            'keyboard': 'keyboard',
            'mouse': 'mouse',
            'headset': 'headphones',
            'speaker': 'speakers'
        };
    }

    /**
     * Search for parts using PCPartPicker JSON API
     * @param {string} query - Search query
     * @param {string} category - Part category
     * @param {number} limit - Result limit
     * @returns {Promise<Array>} Search results
     */
    async searchParts(query, category = null, limit = 10) {
        try {
            const cacheKey = `pcpartpicker_json_${query}_${category}_${limit}`;
            
            // Check cache first
            const cached = await this.getCachedData(cacheKey);
            if (cached) {
                return cached;
            }

            // Build search URL for JSON API
            const searchUrl = this.buildSearchUrl(query, category);
            
            // Make request to PCPartPicker JSON API
            const response = await this.makeRequest('GET', searchUrl, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'ComputerLab-Inventory/1.0 (PC Parts Comparison)'
                }
            });
            
            // Parse JSON response
            const parts = this.parseJSONResults(response, limit);
            
            // Cache the results for 2 hours
            await this.cacheData(cacheKey, parts, 2);
            
            return parts;

        } catch (error) {
            console.error('PCPartPicker JSON API search error:', error);
            console.log('PCPartPicker JSON API unavailable, returning empty results');
            return [];
        }
    }

    /**
     * Get detailed part information from JSON API
     * @param {string} partId - PCPartPicker part ID
     * @returns {Promise<Object>} Part details
     */
    async getPartDetails(partId) {
        try {
            // Check cache first
            const cached = await this.getCachedData(partId);
            if (cached) {
                return cached;
            }

            const detailUrl = `/api/parts/${partId}`;
            const response = await this.makeRequest('GET', detailUrl);
            
            const partDetails = this.parsePartDetails(response);
            
            // Cache for 24 hours
            await this.cacheData(partId, partDetails, 24);
            
            return partDetails;

        } catch (error) {
            console.error('PCPartPicker JSON API part details error:', error);
            throw new Error(`Failed to get PCPartPicker JSON API part details: ${error.message}`);
        }
    }

    /**
     * Extract specifications from PCPartPicker JSON data
     * @param {Object} partData - Raw part data from JSON API
     * @returns {Object} Extracted specifications
     */
    extractSpecifications(partData) {
        const specs = {};
        
        if (!partData.specifications) {
            return specs;
        }

        // PCPartPicker JSON API provides structured specifications
        const specMappings = {
            // CPU specifications
            'cores': ['cores', 'core count', 'cpu cores'],
            'threads': ['threads', 'thread count', 'cpu threads'],
            'base_clock': ['base clock', 'base frequency', 'cpu base clock'],
            'boost_clock': ['boost clock', 'max boost clock', 'cpu boost clock'],
            'tdp': ['tdp', 'thermal design power', 'power consumption'],
            'socket': ['socket', 'cpu socket', 'socket type'],
            'lithography': ['lithography', 'process node', 'manufacturing process'],
            
            // GPU specifications
            'memory': ['memory', 'vram', 'video memory'],
            'memory_type': ['memory type', 'vram type', 'memory interface'],
            'base_clock_gpu': ['base clock', 'gpu base clock', 'graphics base clock'],
            'boost_clock_gpu': ['boost clock', 'gpu boost clock', 'graphics boost clock'],
            'memory_bandwidth': ['memory bandwidth', 'memory bus'],
            'cuda_cores': ['cuda cores', 'stream processors'],
            
            // Memory specifications
            'capacity': ['capacity', 'size', 'memory size'],
            'speed': ['speed', 'frequency', 'memory speed'],
            'type': ['type', 'memory type', 'ddr type'],
            'cas_latency': ['cas latency', 'cl', 'timing'],
            'voltage': ['voltage', 'memory voltage'],
            
            // Storage specifications
            'capacity_storage': ['capacity', 'size', 'storage capacity'],
            'type_storage': ['type', 'storage type', 'interface'],
            'read_speed': ['read speed', 'sequential read', 'read performance'],
            'write_speed': ['write speed', 'sequential write', 'write performance'],
            'form_factor': ['form factor', 'size', 'physical size']
        };

        // Extract specifications using mappings
        for (const [specKey, searchTerms] of Object.entries(specMappings)) {
            for (const term of searchTerms) {
                const spec = partData.specifications.find(s => 
                    s.name.toLowerCase().includes(term.toLowerCase())
                );
                
                if (spec && !specs[specKey]) {
                    specs[specKey] = {
                        name: spec.name,
                        value: spec.value,
                        unit: this.extractUnit(spec.value)
                    };
                    break;
                }
            }
        }

        return specs;
    }

    /**
     * Build search URL for PCPartPicker JSON API
     * @param {string} query - Search query
     * @param {string} category - Part category
     * @returns {string} Search URL
     */
    buildSearchUrl(query, category) {
        let url = '/api/parts/search';
        
        const params = new URLSearchParams({
            q: query,
            limit: 20
        });
        
        if (category && this.categoryMappings[category.toLowerCase()]) {
            params.append('category', this.categoryMappings[category.toLowerCase()]);
        }
        
        return `${url}?${params.toString()}`;
    }

    /**
     * Parse JSON search results
     * @param {Object} jsonResponse - JSON response from API
     * @param {number} limit - Result limit
     * @returns {Array} Parsed parts
     */
    parseJSONResults(jsonResponse, limit) {
        const parts = [];
        
        try {
            if (jsonResponse && jsonResponse.results && Array.isArray(jsonResponse.results)) {
                const results = jsonResponse.results.slice(0, limit);
                
                for (const result of results) {
                    const part = this.normalizePartData({
                        id: result.id,
                        name: result.name,
                        brand: result.brand,
                        model: result.model,
                        category: result.category,
                        price: result.price,
                        currency: result.currency || 'USD',
                        image: result.image,
                        url: result.url,
                        specifications: result.specifications || {}
                    });
                    
                    parts.push(part);
                }
            }

        } catch (error) {
            console.error('Error parsing PCPartPicker JSON results:', error);
        }

        return parts;
    }

    /**
     * Parse part details from JSON response
     * @param {Object} jsonResponse - JSON response
     * @returns {Object} Parsed part details
     */
    parsePartDetails(jsonResponse) {
        const part = {
            id: jsonResponse.id,
            name: jsonResponse.name,
            brand: jsonResponse.brand,
            model: jsonResponse.model,
            category: jsonResponse.category,
            price: jsonResponse.price,
            currency: jsonResponse.currency || 'USD',
            image: jsonResponse.image,
            url: jsonResponse.url,
            specifications: jsonResponse.specifications || []
        };

        return part;
    }

    /**
     * Extract unit from specification value
     * @param {string} value - Specification value
     * @returns {string|null} Extracted unit
     */
    extractUnit(value) {
        if (!value) return null;

        const unitRegex = /([0-9,\.]+)\s*([a-zA-Z%°]+)/;
        const match = value.match(unitRegex);
        
        return match ? match[2] : null;
    }

    /**
     * Get available categories
     * @returns {Array} Available categories
     */
    getAvailableCategories() {
        return Object.keys(this.categoryMappings);
    }

    /**
     * Map category to PCPartPicker JSON API category
     * @param {string} category - General category
     * @returns {string|null} PCPartPicker category
     */
    mapCategory(category) {
        return this.categoryMappings[category?.toLowerCase()] || null;
    }
}

module.exports = PCPartPickerJSONAPIService;
