const BaseAPIService = require('./base-api.service');

/**
 * Newegg API service for fetching PC hardware specifications
 * This service uses Newegg's product search API
 */
class NeweggAPIService extends BaseAPIService {
    constructor() {
        super('newegg', 'https://www.newegg.com', 3000); // 3 second delay between requests
        
        // Newegg category mappings
        this.categoryMappings = {
            'cpu': 'processors-desktops',
            'processor': 'processors-desktops',
            'gpu': 'graphics-cards',
            'graphics-card': 'graphics-cards',
            'memory': 'memory-desktops',
            'ram': 'memory-desktops',
            'storage': 'internal-hard-drives',
            'hard-drive': 'internal-hard-drives',
            'ssd': 'internal-hard-drives',
            'motherboard': 'motherboards',
            'case': 'computer-cases',
            'power-supply': 'power-supplies',
            'psu': 'power-supplies',
            'monitor': 'monitors',
            'keyboard': 'keyboards',
            'mouse': 'mice',
            'headset': 'headsets',
            'speaker': 'speakers'
        };
    }

    /**
     * Search for parts on Newegg
     * @param {string} query - Search query
     * @param {string} category - Part category
     * @param {number} limit - Result limit
     * @returns {Promise<Array>} Search results
     */
    async searchParts(query, category = null, limit = 10) {
        try {
            const cacheKey = `newegg_search_${query}_${category}_${limit}`;
            
            // Check cache first
            const cached = await this.getCachedData(cacheKey);
            if (cached) {
                return cached;
            }

            // Build search URL
            const searchUrl = this.buildSearchUrl(query, category);
            
            // Make request to Newegg
            const response = await this.makeRequest('GET', searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Referer': 'https://www.newegg.com/'
                }
            });
            
            // Parse the HTML response
            const parts = this.parseSearchResults(response, limit);
            
            // Cache the results for 2 hours
            await this.cacheData(cacheKey, parts, 2);
            
            return parts;

        } catch (error) {
            console.error('Newegg search error:', error);
            console.log('Newegg unavailable, returning empty results');
            return [];
        }
    }

    /**
     * Get detailed part information
     * @param {string} partId - Newegg part ID
     * @returns {Promise<Object>} Part details
     */
    async getPartDetails(partId) {
        try {
            // Check cache first
            const cached = await this.getCachedData(partId);
            if (cached) {
                return cached;
            }

            const detailUrl = `/p/${partId}`;
            const response = await this.makeRequest('GET', detailUrl);
            
            const partDetails = this.parsePartDetails(response);
            
            // Cache for 24 hours
            await this.cacheData(partId, partDetails, 24);
            
            return partDetails;

        } catch (error) {
            console.error('Newegg part details error:', error);
            throw new Error(`Failed to get Newegg part details: ${error.message}`);
        }
    }

    /**
     * Extract specifications from Newegg data
     * @param {Object} partData - Raw part data
     * @returns {Object} Extracted specifications
     */
    extractSpecifications(partData) {
        const specs = {};
        
        if (!partData.specifications) {
            return specs;
        }

        // Use the same specification mappings as PCPartPicker
        const specMappings = {
            'cores': ['cores', 'core count', 'cpu cores'],
            'threads': ['threads', 'thread count', 'cpu threads'],
            'base_clock': ['base clock', 'base frequency', 'cpu base clock'],
            'boost_clock': ['boost clock', 'max boost clock', 'cpu boost clock'],
            'tdp': ['tdp', 'thermal design power', 'power consumption'],
            'socket': ['socket', 'cpu socket', 'socket type'],
            'lithography': ['lithography', 'process node', 'manufacturing process'],
            'memory': ['memory', 'vram', 'video memory'],
            'memory_type': ['memory type', 'vram type', 'memory interface'],
            'base_clock_gpu': ['base clock', 'gpu base clock', 'graphics base clock'],
            'boost_clock_gpu': ['boost clock', 'gpu boost clock', 'graphics boost clock'],
            'memory_bandwidth': ['memory bandwidth', 'memory bus'],
            'cuda_cores': ['cuda cores', 'stream processors']
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
     * Build search URL for Newegg
     * @param {string} query - Search query
     * @param {string} category - Part category
     * @returns {string} Search URL
     */
    buildSearchUrl(query, category) {
        let url = '/product/';
        
        if (category && this.categoryMappings[category.toLowerCase()]) {
            url += this.categoryMappings[category.toLowerCase()] + '/';
        }
        
        url += `?q=${encodeURIComponent(query)}`;
        
        return url;
    }

    /**
     * Parse search results from Newegg HTML
     * @param {string} html - HTML response
     * @param {number} limit - Result limit
     * @returns {Array} Parsed parts
     */
    parseSearchResults(html, limit) {
        const parts = [];
        
        try {
            // Newegg product item regex
            const productRegex = /<div class="item-container"[^>]*>(.*?)<\/div>/gs;
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
            console.error('Error parsing Newegg search results:', error);
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
            const idMatch = productHtml.match(/href="\/p\/([^"]+)"/);
            const nameMatch = productHtml.match(/title="([^"]+)"/);
            const priceMatch = productHtml.match(/class="price-current"[^>]*>([^<]+)</);
            const imageMatch = productHtml.match(/src="([^"]+)"/);

            if (!idMatch) return null;

            return {
                id: idMatch[1],
                name: nameMatch ? nameMatch[1] : 'Unknown Product',
                price: priceMatch ? this.parsePrice(priceMatch[1]) : null,
                image: imageMatch ? imageMatch[1] : null,
                url: `https://www.newegg.com/p/${idMatch[1]}`,
                specifications: {} // Will be filled by getPartDetails
            };

        } catch (error) {
            console.error('Error parsing product item:', error);
            return null;
        }
    }

    /**
     * Parse part details from Newegg product page
     * @param {string} html - HTML response
     * @returns {Object} Parsed part details
     */
    parsePartDetails(html) {
        const part = {
            specifications: []
        };

        try {
            // Extract specifications from Newegg's spec table
            const specTableRegex = /<table[^>]*class="table-horizontal"[^>]*>(.*?)<\/table>/s;
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
            const priceMatch = html.match(/<span[^>]*class="price-current"[^>]*>([^<]+)<\/span>/);
            const imageMatch = html.match(/<img[^>]*src="([^"]+)"[^>]*class="product-view-img-original"/);

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
     * Map category to Newegg category
     * @param {string} category - General category
     * @returns {string|null} Newegg category
     */
    mapCategory(category) {
        return this.categoryMappings[category?.toLowerCase()] || null;
    }
}

module.exports = NeweggAPIService;
