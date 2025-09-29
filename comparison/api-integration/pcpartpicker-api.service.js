const BaseAPIService = require('./base-api.service');

/**
 * PCPartPicker API service for fetching PC hardware specifications
 * This service scrapes PCPartPicker since they don't have an official API
 */
class PCPartPickerAPIService extends BaseAPIService {
    constructor() {
        super('pcpartpicker', 'https://pcpartpicker.com', 2000); // 2 second delay between requests
        
        // PCPartPicker category mappings
        this.categoryMappings = {
            'cpu': 'cpu',
            'processor': 'cpu',
            'graphics-card': 'gpu',
            'gpu': 'gpu',
            'memory': 'memory',
            'ram': 'memory',
            'storage': 'storage',
            'hard-drive': 'storage',
            'ssd': 'storage',
            'motherboard': 'motherboard',
            'case': 'case',
            'power-supply': 'psu',
            'psu': 'psu',
            'monitor': 'monitor',
            'keyboard': 'keyboard',
            'mouse': 'mouse',
            'headset': 'headset',
            'speaker': 'speaker'
        };
    }

    /**
     * Search for parts on PCPartPicker
     * @param {string} query - Search query
     * @param {string} category - Part category
     * @param {number} limit - Result limit
     * @returns {Promise<Array>} Search results
     */
    async searchParts(query, category = null, limit = 10) {
        try {
            const cacheKey = `search_${query}_${category}_${limit}`;
            
            // Check cache first
            const cached = await this.getCachedData(cacheKey);
            if (cached) {
                return cached;
            }

            // Build search URL
            const searchUrl = this.buildSearchUrl(query, category);
            
            // Make request to PCPartPicker
            const response = await this.makeRequest('GET', searchUrl);
            
            // Parse the HTML response
            const parts = this.parseSearchResults(response, limit);
            
            // Cache the results for 1 hour
            await this.cacheData(cacheKey, parts, 1);
            
            return parts;

        } catch (error) {
            console.error('PCPartPicker search error:', error);
            throw new Error(`Failed to search PCPartPicker: ${error.message}`);
        }
    }

    /**
     * Get detailed part information
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

            const detailUrl = `/product/${partId}`;
            const response = await this.makeRequest('GET', detailUrl);
            
            const partDetails = this.parsePartDetails(response);
            
            // Cache for 24 hours
            await this.cacheData(partId, partDetails, 24);
            
            return partDetails;

        } catch (error) {
            console.error('PCPartPicker part details error:', error);
            throw new Error(`Failed to get PCPartPicker part details: ${error.message}`);
        }
    }

    /**
     * Extract specifications from PCPartPicker data
     * @param {Object} partData - Raw part data
     * @returns {Object} Extracted specifications
     */
    extractSpecifications(partData) {
        const specs = {};
        
        if (!partData.specifications) {
            return specs;
        }

        // Common specification mappings
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
            'form_factor': ['form factor', 'size', 'physical size'],
            
            // Monitor specifications
            'screen_size': ['screen size', 'display size', 'size'],
            'resolution': ['resolution', 'display resolution'],
            'refresh_rate': ['refresh rate', 'frequency'],
            'response_time': ['response time', 'gray to gray'],
            'brightness': ['brightness', 'luminance', 'nits'],
            'contrast_ratio': ['contrast ratio', 'contrast'],
            'panel_type': ['panel type', 'display technology'],
            
            // Power Supply specifications
            'wattage': ['wattage', 'power', 'watt'],
            'efficiency': ['efficiency', 'certification', '80 plus'],
            'modular': ['modular', 'modularity'],
            'form_factor_psu': ['form factor', 'size', 'psu size']
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
     * Build search URL for PCPartPicker
     * @param {string} query - Search query
     * @param {string} category - Part category
     * @returns {string} Search URL
     */
    buildSearchUrl(query, category) {
        let url = '/search/';
        
        if (category && this.categoryMappings[category.toLowerCase()]) {
            url += this.categoryMappings[category.toLowerCase()] + '/';
        }
        
        url += `?q=${encodeURIComponent(query)}`;
        
        return url;
    }

    /**
     * Parse search results from PCPartPicker HTML
     * @param {string} html - HTML response
     * @param {number} limit - Result limit
     * @returns {Array} Parsed parts
     */
    parseSearchResults(html, limit) {
        const parts = [];
        
        try {
            // This is a simplified parser - in a real implementation,
            // you would use a proper HTML parser like cheerio
            const productRegex = /<div class="product-item"[^>]*>(.*?)<\/div>/gs;
            let match;
            let count = 0;

            while ((match = productRegex.exec(html)) !== null && count < limit) {
                const productHtml = match[1];
                const part = this.parseProductItem(productHtml);
                
                if (part && part.id) {
                    parts.push(this.normalizePartData(part));
                    count++;
                }
            }

        } catch (error) {
            console.error('Error parsing PCPartPicker search results:', error);
        }

        return parts;
    }

    /**
     * Parse individual product item from HTML
     * @param {string} productHtml - Product HTML
     * @returns {Object} Parsed product
     */
    parseProductItem(productHtml) {
        try {
            // Extract basic information using regex patterns
            const idMatch = productHtml.match(/href="\/product\/([^"]+)"/);
            const nameMatch = productHtml.match(/title="([^"]+)"/);
            const priceMatch = productHtml.match(/class="price">([^<]+)</);
            const imageMatch = productHtml.match(/src="([^"]+)"/);

            if (!idMatch) return null;

            return {
                id: idMatch[1],
                name: nameMatch ? nameMatch[1] : 'Unknown Product',
                price: priceMatch ? this.parsePrice(priceMatch[1]) : null,
                image: imageMatch ? imageMatch[1] : null,
                url: `https://pcpartpicker.com/product/${idMatch[1]}`,
                specifications: {} // Will be filled by getPartDetails
            };

        } catch (error) {
            console.error('Error parsing product item:', error);
            return null;
        }
    }

    /**
     * Parse part details from PCPartPicker product page
     * @param {string} html - HTML response
     * @returns {Object} Parsed part details
     */
    parsePartDetails(html) {
        const part = {
            specifications: []
        };

        try {
            // Extract specifications table
            const specTableRegex = /<table[^>]*class="specs"[^>]*>(.*?)<\/table>/s;
            const tableMatch = html.match(specTableRegex);

            if (tableMatch) {
                const specsHtml = tableMatch[1];
                const specRowRegex = /<tr[^>]*>.*?<td[^>]*>([^<]+)<\/td>.*?<td[^>]*>([^<]+)<\/td>.*?<\/tr>/gs;
                let specMatch;

                while ((specMatch = specRowRegex.exec(specsHtml)) !== null) {
                    part.specifications.push({
                        name: specMatch[1].trim(),
                        value: specMatch[2].trim()
                    });
                }
            }

            // Extract basic product info
            const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
            const priceMatch = html.match(/<span[^>]*class="price"[^>]*>([^<]+)<\/span>/);
            const imageMatch = html.match(/<img[^>]*src="([^"]+)"[^>]*class="product-image"/);

            if (nameMatch) part.name = nameMatch[1].trim();
            if (priceMatch) part.price = this.parsePrice(priceMatch[1]);
            if (imageMatch) part.image = imageMatch[1];

        } catch (error) {
            console.error('Error parsing part details:', error);
        }

        return part;
    }

    /**
     * Parse price string to number
     * @param {string} priceStr - Price string
     * @returns {number|null} Parsed price
     */
    parsePrice(priceStr) {
        if (!priceStr) return null;
        
        const match = priceStr.match(/\$?([0-9,]+\.?[0-9]*)/);
        return match ? parseFloat(match[1].replace(/,/g, '')) : null;
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
     * Map category to PCPartPicker category
     * @param {string} category - General category
     * @returns {string|null} PCPartPicker category
     */
    mapCategory(category) {
        return this.categoryMappings[category?.toLowerCase()] || null;
    }
}

module.exports = PCPartPickerAPIService;
