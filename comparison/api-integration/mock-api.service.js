const BaseAPIService = require('./base-api.service');

/**
 * Mock API service for testing and development
 * Provides sample data for PC hardware parts
 */
class MockAPIService extends BaseAPIService {
    constructor() {
        super('mock', 'https://mock-api.com', 100); // Fast for testing
        
        // Sample data for testing
        this.sampleParts = [
            {
                id: 'mock-cpu-001',
                name: 'Intel Core i7-12700K',
                brand: 'Intel',
                model: 'i7-12700K',
                category: 'cpu',
                price: 399.99,
                currency: 'USD',
                image: 'https://example.com/cpu1.jpg',
                url: 'https://example.com/product/cpu1',
                specifications: {
                    cores: { name: 'Cores', value: '12', unit: 'cores' },
                    threads: { name: 'Threads', value: '20', unit: 'threads' },
                    base_clock: { name: 'Base Clock', value: '3.6', unit: 'GHz' },
                    boost_clock: { name: 'Max Turbo Frequency', value: '5.0', unit: 'GHz' },
                    tdp: { name: 'TDP', value: '125', unit: 'W' },
                    socket: { name: 'Socket', value: 'LGA 1700', unit: null },
                    lithography: { name: 'Lithography', value: '10', unit: 'nm' }
                }
            },
            {
                id: 'mock-gpu-001',
                name: 'NVIDIA GeForce RTX 4070',
                brand: 'NVIDIA',
                model: 'RTX 4070',
                category: 'gpu',
                price: 599.99,
                currency: 'USD',
                image: 'https://example.com/gpu1.jpg',
                url: 'https://example.com/product/gpu1',
                specifications: {
                    memory: { name: 'Memory', value: '12', unit: 'GB' },
                    memory_type: { name: 'Memory Type', value: 'GDDR6X', unit: null },
                    base_clock_gpu: { name: 'Base Clock', value: '1920', unit: 'MHz' },
                    boost_clock_gpu: { name: 'Boost Clock', value: '2475', unit: 'MHz' },
                    memory_bandwidth: { name: 'Memory Bandwidth', value: '504.2', unit: 'GB/s' },
                    cuda_cores: { name: 'CUDA Cores', value: '5888', unit: 'cores' }
                }
            },
            {
                id: 'mock-ram-001',
                name: 'Corsair Vengeance LPX 32GB (2x16GB) DDR4-3200',
                brand: 'Corsair',
                model: 'CMK32GX4M2E3200C16',
                category: 'memory',
                price: 129.99,
                currency: 'USD',
                image: 'https://example.com/ram1.jpg',
                url: 'https://example.com/product/ram1',
                specifications: {
                    capacity: { name: 'Capacity', value: '32', unit: 'GB' },
                    speed: { name: 'Speed', value: '3200', unit: 'MHz' },
                    type: { name: 'Type', value: 'DDR4', unit: null },
                    cas_latency: { name: 'CAS Latency', value: '16', unit: 'CL' },
                    voltage: { name: 'Voltage', value: '1.35', unit: 'V' }
                }
            },
            {
                id: 'mock-ssd-001',
                name: 'Samsung 980 PRO 1TB M.2 NVMe SSD',
                brand: 'Samsung',
                model: 'MZ-V8P1T0B/AM',
                category: 'storage',
                price: 149.99,
                currency: 'USD',
                image: 'https://example.com/ssd1.jpg',
                url: 'https://example.com/product/ssd1',
                specifications: {
                    capacity_storage: { name: 'Capacity', value: '1', unit: 'TB' },
                    type_storage: { name: 'Interface', value: 'M.2 NVMe', unit: null },
                    read_speed: { name: 'Sequential Read', value: '7000', unit: 'MB/s' },
                    write_speed: { name: 'Sequential Write', value: '5000', unit: 'MB/s' },
                    form_factor: { name: 'Form Factor', value: 'M.2 2280', unit: null }
                }
            },
            {
                id: 'mock-monitor-001',
                name: 'ASUS ROG Swift PG27UQ 27" 4K Gaming Monitor',
                brand: 'ASUS',
                model: 'PG27UQ',
                category: 'monitor',
                price: 899.99,
                currency: 'USD',
                image: 'https://example.com/monitor1.jpg',
                url: 'https://example.com/product/monitor1',
                specifications: {
                    screen_size: { name: 'Screen Size', value: '27', unit: 'inches' },
                    resolution: { name: 'Resolution', value: '3840 x 2160', unit: 'pixels' },
                    refresh_rate: { name: 'Refresh Rate', value: '144', unit: 'Hz' },
                    response_time: { name: 'Response Time', value: '4', unit: 'ms' },
                    brightness: { name: 'Brightness', value: '1000', unit: 'cd/m²' },
                    panel_type: { name: 'Panel Type', value: 'IPS', unit: null }
                }
            },
            {
                id: 'mock-psu-001',
                name: 'Corsair RM850x 850W 80+ Gold Fully Modular PSU',
                brand: 'Corsair',
                model: 'CP-9020180-NA',
                category: 'psu',
                price: 149.99,
                currency: 'USD',
                image: 'https://example.com/psu1.jpg',
                url: 'https://example.com/product/psu1',
                specifications: {
                    wattage: { name: 'Wattage', value: '850', unit: 'W' },
                    efficiency: { name: 'Efficiency', value: '80+ Gold', unit: null },
                    modular: { name: 'Modular', value: 'Fully Modular', unit: null },
                    form_factor_psu: { name: 'Form Factor', value: 'ATX', unit: null }
                }
            }
        ];
    }

    /**
     * Search for parts (mock implementation)
     * @param {string} query - Search query
     * @param {string} category - Part category
     * @param {number} limit - Result limit
     * @returns {Promise<Array>} Search results
     */
    async searchParts(query, category = null, limit = 10) {
        try {
            const cacheKey = `mock_search_${query}_${category}_${limit}`;
            
            // Check cache first
            const cached = await this.getCachedData(cacheKey);
            if (cached) {
                return cached;
            }

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));

            // Filter parts based on query and category
            let results = this.sampleParts;

            // Filter by category (flexible matching)
            if (category) {
                const categoryLower = category.toLowerCase();
                results = results.filter(part => {
                    const partCategory = part.category.toLowerCase();
                    // Check for exact match or if category contains the part category
                    return partCategory === categoryLower || 
                           categoryLower.includes(partCategory) ||
                           partCategory.includes(categoryLower) ||
                           // Handle common category mappings
                           (categoryLower.includes('cpu') && partCategory === 'cpu') ||
                           (categoryLower.includes('gpu') && partCategory === 'gpu') ||
                           (categoryLower.includes('memory') && partCategory === 'ram') ||
                           (categoryLower.includes('storage') && partCategory === 'storage');
                });
            }

            // Filter by query (flexible text search)
            if (query) {
                const queryLower = query.toLowerCase();
                results = results.filter(part => {
                    const nameLower = part.name.toLowerCase();
                    const brandLower = part.brand.toLowerCase();
                    const modelLower = part.model.toLowerCase();
                    
                    // Split query into words for better matching
                    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 0);
                    
                    // Check if any query word matches any part field
                    return queryWords.some(word => 
                        nameLower.includes(word) ||
                        brandLower.includes(word) ||
                        modelLower.includes(word) ||
                        // Also check if part name contains any query word
                        nameLower.includes(word)
                    ) || 
                    // Fallback: check if any part field contains the full query
                    nameLower.includes(queryLower) ||
                    brandLower.includes(queryLower) ||
                    modelLower.includes(queryLower);
                });
            }

            // Limit results
            results = results.slice(0, limit);

            // Cache for 1 hour
            await this.cacheData(cacheKey, results, 1);

            return results;

        } catch (error) {
            console.error('Mock API search error:', error);
            throw new Error(`Mock API search failed: ${error.message}`);
        }
    }

    /**
     * Get part details (mock implementation)
     * @param {string} partId - Part identifier
     * @returns {Promise<Object>} Part details
     */
    async getPartDetails(partId) {
        try {
            // Check cache first
            const cached = await this.getCachedData(partId);
            if (cached) {
                return cached;
            }

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 300));

            // Find the part
            const part = this.sampleParts.find(p => p.id === partId);
            
            if (!part) {
                throw new Error(`Part with ID ${partId} not found`);
            }

            // Add additional mock details
            const detailedPart = {
                ...part,
                description: `High-quality ${part.brand} ${part.name} for professional and gaming use.`,
                features: this.generateMockFeatures(part),
                reviews: this.generateMockReviews(part),
                availability: {
                    inStock: Math.random() > 0.2, // 80% chance of being in stock
                    stockCount: Math.floor(Math.random() * 50) + 1,
                    estimatedShipping: '1-3 business days'
                }
            };

            // Cache for 24 hours
            await this.cacheData(partId, detailedPart, 24);

            return detailedPart;

        } catch (error) {
            console.error('Mock API part details error:', error);
            throw new Error(`Mock API part details failed: ${error.message}`);
        }
    }

    /**
     * Extract specifications from mock data
     * @param {Object} partData - Part data
     * @returns {Object} Extracted specifications
     */
    extractSpecifications(partData) {
        return partData.specifications || {};
    }

    /**
     * Generate mock features for a part
     * @param {Object} part - Part data
     * @returns {Array} Mock features
     */
    generateMockFeatures(part) {
        const features = [
            'High performance',
            'Energy efficient',
            'Reliable build quality',
            'Compatible with latest standards'
        ];

        // Add category-specific features
        switch (part.category) {
            case 'cpu':
                features.push('Advanced thermal management', 'Multi-core processing');
                break;
            case 'gpu':
                features.push('Ray tracing support', 'DLSS technology', 'Advanced cooling');
                break;
            case 'memory':
                features.push('Low latency', 'XMP support');
                break;
            case 'storage':
                features.push('Fast read/write speeds', 'Advanced controller');
                break;
            case 'monitor':
                features.push('High resolution', 'Fast response time', 'Wide color gamut');
                break;
            case 'psu':
                features.push('Modular design', 'Silent operation', 'High efficiency');
                break;
        }

        return features;
    }

    /**
     * Generate mock reviews for a part
     * @param {Object} part - Part data
     * @returns {Array} Mock reviews
     */
    generateMockReviews(part) {
        const reviews = [];
        const reviewCount = Math.floor(Math.random() * 20) + 5; // 5-24 reviews

        for (let i = 0; i < reviewCount; i++) {
            reviews.push({
                rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
                title: `Great ${part.category}!`,
                content: `This ${part.name} performs excellently. Highly recommended for anyone looking for quality ${part.category}.`,
                author: `User${Math.floor(Math.random() * 1000)}`,
                date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
            });
        }

        return reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    /**
     * Get sample parts by category
     * @param {string} category - Part category
     * @returns {Array} Parts in category
     */
    getPartsByCategory(category) {
        return this.sampleParts.filter(part => part.category === category);
    }

    /**
     * Get all available categories
     * @returns {Array} Available categories
     */
    getAvailableCategories() {
        return [...new Set(this.sampleParts.map(part => part.category))];
    }

    /**
     * Add a new mock part
     * @param {Object} partData - Part data
     * @returns {Object} Added part
     */
    addMockPart(partData) {
        const newPart = {
            id: `mock-${partData.category}-${Date.now()}`,
            ...partData,
            source: 'mock'
        };
        
        this.sampleParts.push(newPart);
        return newPart;
    }

    /**
     * Remove a mock part
     * @param {string} partId - Part ID to remove
     * @returns {boolean} Success status
     */
    removeMockPart(partId) {
        const index = this.sampleParts.findIndex(part => part.id === partId);
        if (index > -1) {
            this.sampleParts.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Get mock statistics
     * @returns {Object} Mock statistics
     */
    getMockStats() {
        const stats = {
            totalParts: this.sampleParts.length,
            categories: {},
            priceRange: {
                min: Math.min(...this.sampleParts.map(p => p.price)),
                max: Math.max(...this.sampleParts.map(p => p.price)),
                average: this.sampleParts.reduce((sum, p) => sum + p.price, 0) / this.sampleParts.length
            }
        };

        // Count by category
        this.sampleParts.forEach(part => {
            stats.categories[part.category] = (stats.categories[part.category] || 0) + 1;
        });

        return stats;
    }
}

module.exports = MockAPIService;
