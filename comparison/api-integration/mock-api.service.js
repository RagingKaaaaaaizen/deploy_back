const BaseAPIService = require('./base-api.service');

/**
 * Mock API service for testing and development
 * Provides sample data for PC hardware parts
 */
class MockAPIService extends BaseAPIService {
    constructor() {
        super('mock', 'https://mock-api.com', 100); // Fast for testing
        
        // Enhanced sample data for comprehensive testing
        this.sampleParts = [
            // Intel CPUs
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
                id: 'mock-cpu-002',
                name: 'Intel Core i5-12600K',
                brand: 'Intel',
                model: 'i5-12600K',
                category: 'cpu',
                price: 289.99,
                currency: 'USD',
                image: 'https://example.com/cpu2.jpg',
                url: 'https://example.com/product/cpu2',
                specifications: {
                    cores: { name: 'Cores', value: '10', unit: 'cores' },
                    threads: { name: 'Threads', value: '16', unit: 'threads' },
                    base_clock: { name: 'Base Clock', value: '3.7', unit: 'GHz' },
                    boost_clock: { name: 'Max Turbo Frequency', value: '4.9', unit: 'GHz' },
                    tdp: { name: 'TDP', value: '125', unit: 'W' },
                    socket: { name: 'Socket', value: 'LGA 1700', unit: null },
                    lithography: { name: 'Lithography', value: '10', unit: 'nm' }
                }
            },
            {
                id: 'mock-cpu-003',
                name: 'AMD Ryzen 7 5800X',
                brand: 'AMD',
                model: '5800X',
                category: 'cpu',
                price: 349.99,
                currency: 'USD',
                image: 'https://example.com/cpu3.jpg',
                url: 'https://example.com/product/cpu3',
                specifications: {
                    cores: { name: 'Cores', value: '8', unit: 'cores' },
                    threads: { name: 'Threads', value: '16', unit: 'threads' },
                    base_clock: { name: 'Base Clock', value: '3.8', unit: 'GHz' },
                    boost_clock: { name: 'Max Turbo Frequency', value: '4.7', unit: 'GHz' },
                    tdp: { name: 'TDP', value: '105', unit: 'W' },
                    socket: { name: 'Socket', value: 'AM4', unit: null },
                    lithography: { name: 'Lithography', value: '7', unit: 'nm' }
                }
            },
            // NVIDIA GPUs
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
                id: 'mock-gpu-002',
                name: 'NVIDIA GeForce RTX 4080',
                brand: 'NVIDIA',
                model: 'RTX 4080',
                category: 'gpu',
                price: 1199.99,
                currency: 'USD',
                image: 'https://example.com/gpu2.jpg',
                url: 'https://example.com/product/gpu2',
                specifications: {
                    memory: { name: 'Memory', value: '16', unit: 'GB' },
                    memory_type: { name: 'Memory Type', value: 'GDDR6X', unit: null },
                    base_clock_gpu: { name: 'Base Clock', value: '2210', unit: 'MHz' },
                    boost_clock_gpu: { name: 'Boost Clock', value: '2505', unit: 'MHz' },
                    memory_bandwidth: { name: 'Memory Bandwidth', value: '716.8', unit: 'GB/s' },
                    cuda_cores: { name: 'CUDA Cores', value: '9728', unit: 'cores' }
                }
            },
            // AMD GPUs
            {
                id: 'mock-gpu-003',
                name: 'AMD Radeon RX 7800 XT',
                brand: 'AMD',
                model: 'RX 7800 XT',
                category: 'gpu',
                price: 499.99,
                currency: 'USD',
                image: 'https://example.com/gpu3.jpg',
                url: 'https://example.com/product/gpu3',
                specifications: {
                    memory: { name: 'Memory', value: '16', unit: 'GB' },
                    memory_type: { name: 'Memory Type', value: 'GDDR6', unit: null },
                    base_clock_gpu: { name: 'Base Clock', value: '1295', unit: 'MHz' },
                    boost_clock_gpu: { name: 'Boost Clock', value: '2430', unit: 'MHz' },
                    memory_bandwidth: { name: 'Memory Bandwidth', value: '624.1', unit: 'GB/s' },
                    stream_processors: { name: 'Stream Processors', value: '3840', unit: 'units' }
                }
            },
            // Memory/RAM
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
                id: 'mock-ram-002',
                name: 'G.Skill Trident Z5 32GB (2x16GB) DDR5-6000',
                brand: 'G.Skill',
                model: 'F5-6000J3636F16GX2-TZ5K',
                category: 'memory',
                price: 189.99,
                currency: 'USD',
                image: 'https://example.com/ram2.jpg',
                url: 'https://example.com/product/ram2',
                specifications: {
                    capacity: { name: 'Capacity', value: '32', unit: 'GB' },
                    speed: { name: 'Speed', value: '6000', unit: 'MHz' },
                    type: { name: 'Type', value: 'DDR5', unit: null },
                    cas_latency: { name: 'CAS Latency', value: '36', unit: 'CL' },
                    voltage: { name: 'Voltage', value: '1.35', unit: 'V' }
                }
            },
            {
                id: 'mock-ram-003',
                name: 'Kingston Fury Beast 16GB (1x16GB) DDR4-3200',
                brand: 'Kingston',
                model: 'KF432C16BB/16',
                category: 'memory',
                price: 69.99,
                currency: 'USD',
                image: 'https://example.com/ram3.jpg',
                url: 'https://example.com/product/ram3',
                specifications: {
                    capacity: { name: 'Capacity', value: '16', unit: 'GB' },
                    speed: { name: 'Speed', value: '3200', unit: 'MHz' },
                    type: { name: 'Type', value: 'DDR4', unit: null },
                    cas_latency: { name: 'CAS Latency', value: '16', unit: 'CL' },
                    voltage: { name: 'Voltage', value: '1.35', unit: 'V' }
                }
            },
            // Storage/SSDs
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
                id: 'mock-ssd-002',
                name: 'WD Black SN850X 2TB M.2 NVMe SSD',
                brand: 'Western Digital',
                model: 'WDS200T2X0E',
                category: 'storage',
                price: 249.99,
                currency: 'USD',
                image: 'https://example.com/ssd2.jpg',
                url: 'https://example.com/product/ssd2',
                specifications: {
                    capacity_storage: { name: 'Capacity', value: '2', unit: 'TB' },
                    type_storage: { name: 'Interface', value: 'M.2 NVMe', unit: null },
                    read_speed: { name: 'Sequential Read', value: '7300', unit: 'MB/s' },
                    write_speed: { name: 'Sequential Write', value: '6300', unit: 'MB/s' },
                    form_factor: { name: 'Form Factor', value: 'M.2 2280', unit: null }
                }
            },
            {
                id: 'mock-ssd-003',
                name: 'Crucial MX4 1TB SATA SSD',
                brand: 'Crucial',
                model: 'CT1000MX500SSD1',
                category: 'storage',
                price: 89.99,
                currency: 'USD',
                image: 'https://example.com/ssd3.jpg',
                url: 'https://example.com/product/ssd3',
                specifications: {
                    capacity_storage: { name: 'Capacity', value: '1', unit: 'TB' },
                    type_storage: { name: 'Interface', value: 'SATA III', unit: null },
                    read_speed: { name: 'Sequential Read', value: '560', unit: 'MB/s' },
                    write_speed: { name: 'Sequential Write', value: '510', unit: 'MB/s' },
                    form_factor: { name: 'Form Factor', value: '2.5-inch', unit: null }
                }
            },
            // Monitors
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
                id: 'mock-monitor-002',
                name: 'Dell UltraSharp U2723QE 27" 4K Monitor',
                brand: 'Dell',
                model: 'U2723QE',
                category: 'monitor',
                price: 649.99,
                currency: 'USD',
                image: 'https://example.com/monitor2.jpg',
                url: 'https://example.com/product/monitor2',
                specifications: {
                    screen_size: { name: 'Screen Size', value: '27', unit: 'inches' },
                    resolution: { name: 'Resolution', value: '3840 x 2160', unit: 'pixels' },
                    refresh_rate: { name: 'Refresh Rate', value: '60', unit: 'Hz' },
                    response_time: { name: 'Response Time', value: '5', unit: 'ms' },
                    brightness: { name: 'Brightness', value: '400', unit: 'cd/m²' },
                    panel_type: { name: 'Panel Type', value: 'IPS', unit: null }
                }
            },
            // Power Supplies
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
            },
            {
                id: 'mock-psu-002',
                name: 'EVGA SuperNOVA 750 G5 750W 80+ Gold PSU',
                brand: 'EVGA',
                model: '220-G5-0750-X1',
                category: 'psu',
                price: 119.99,
                currency: 'USD',
                image: 'https://example.com/psu2.jpg',
                url: 'https://example.com/product/psu2',
                specifications: {
                    wattage: { name: 'Wattage', value: '750', unit: 'W' },
                    efficiency: { name: 'Efficiency', value: '80+ Gold', unit: null },
                    modular: { name: 'Modular', value: 'Fully Modular', unit: null },
                    form_factor_psu: { name: 'Form Factor', value: 'ATX', unit: null }
                }
            },
            // Motherboards
            {
                id: 'mock-motherboard-001',
                name: 'ASUS ROG Strix Z690-E Gaming WiFi',
                brand: 'ASUS',
                model: 'Z690-E Gaming WiFi',
                category: 'motherboard',
                price: 349.99,
                currency: 'USD',
                image: 'https://example.com/motherboard1.jpg',
                url: 'https://example.com/product/motherboard1',
                specifications: {
                    socket: { name: 'Socket', value: 'LGA 1700', unit: null },
                    chipset: { name: 'Chipset', value: 'Intel Z690', unit: null },
                    form_factor_mb: { name: 'Form Factor', value: 'ATX', unit: null },
                    memory_slots: { name: 'Memory Slots', value: '4', unit: 'slots' },
                    max_memory: { name: 'Max Memory', value: '128', unit: 'GB' },
                    memory_type: { name: 'Memory Type', value: 'DDR5', unit: null }
                }
            },
            // Cases
            {
                id: 'mock-case-001',
                name: 'Fractal Design Define 7 Mid Tower Case',
                brand: 'Fractal Design',
                model: 'FD-C-DEF7C-01',
                category: 'case',
                price: 149.99,
                currency: 'USD',
                image: 'https://example.com/case1.jpg',
                url: 'https://example.com/product/case1',
                specifications: {
                    form_factor_case: { name: 'Form Factor', value: 'Mid Tower', unit: null },
                    motherboard_support: { name: 'Motherboard Support', value: 'ATX, mATX, Mini-ITX', unit: null },
                    drive_bays: { name: 'Drive Bays', value: '14', unit: 'bays' },
                    fan_support: { name: 'Fan Support', value: '7', unit: 'fans' },
                    rgb_lighting: { name: 'RGB Lighting', value: 'No', unit: null }
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

            // Enhanced query filtering with intelligent matching
            if (query) {
                const queryLower = query.toLowerCase();
                results = results.filter(part => {
                    const nameLower = part.name.toLowerCase();
                    const brandLower = part.brand.toLowerCase();
                    const modelLower = part.model.toLowerCase();
                    const categoryLower = part.category.toLowerCase();
                    
                    // Split query into words for better matching
                    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 0);
                    
                    // Calculate match score for better ranking
                    let matchScore = 0;
                    
                    // Exact brand match (highest priority)
                    if (brandLower === queryLower) matchScore += 100;
                    if (brandLower.includes(queryLower) || queryLower.includes(brandLower)) matchScore += 50;
                    
                    // Model match
                    if (modelLower === queryLower) matchScore += 80;
                    if (modelLower.includes(queryLower) || queryLower.includes(modelLower)) matchScore += 40;
                    
                    // Name match
                    if (nameLower.includes(queryLower)) matchScore += 30;
                    
                    // Category match
                    if (categoryLower.includes(queryLower) || queryLower.includes(categoryLower)) matchScore += 20;
                    
                    // Word-by-word matching
                    queryWords.forEach(word => {
                        if (nameLower.includes(word)) matchScore += 15;
                        if (brandLower.includes(word)) matchScore += 10;
                        if (modelLower.includes(word)) matchScore += 10;
                        if (categoryLower.includes(word)) matchScore += 5;
                    });
                    
                    // Check specifications for matches
                    if (part.specifications) {
                        Object.values(part.specifications).forEach(spec => {
                            if (spec.value && spec.value.toString().toLowerCase().includes(queryLower)) {
                                matchScore += 5;
                            }
                        });
                    }
                    
                    // Only include if we have a reasonable match
                    return matchScore > 0;
                });
                
                // Sort by match score (highest first)
                results.sort((a, b) => {
                    const scoreA = this.calculateMatchScore(a, queryLower);
                    const scoreB = this.calculateMatchScore(b, queryLower);
                    return scoreB - scoreA;
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
     * Calculate match score for ranking search results
     * @param {Object} part - Part object
     * @param {string} query - Search query
     * @returns {number} Match score
     */
    calculateMatchScore(part, query) {
        const queryLower = query.toLowerCase();
        const nameLower = part.name.toLowerCase();
        const brandLower = part.brand.toLowerCase();
        const modelLower = part.model.toLowerCase();
        const categoryLower = part.category.toLowerCase();
        
        let score = 0;
        
        // Exact matches (highest priority)
        if (brandLower === queryLower) score += 100;
        if (modelLower === queryLower) score += 80;
        
        // Partial matches
        if (brandLower.includes(queryLower) || queryLower.includes(brandLower)) score += 50;
        if (modelLower.includes(queryLower) || queryLower.includes(modelLower)) score += 40;
        if (nameLower.includes(queryLower)) score += 30;
        if (categoryLower.includes(queryLower) || queryLower.includes(categoryLower)) score += 20;
        
        // Word-by-word matching
        const queryWords = queryLower.split(/\s+/).filter(word => word.length > 0);
        queryWords.forEach(word => {
            if (nameLower.includes(word)) score += 15;
            if (brandLower.includes(word)) score += 10;
            if (modelLower.includes(word)) score += 10;
            if (categoryLower.includes(word)) score += 5;
        });
        
        return score;
    }

    /**
     * Get mock statistics
     * @returns {Object} Mock statistics
     */
    getMockStats() {
        const stats = {
            totalParts: this.sampleParts.length,
            categories: {},
            brands: {},
            priceRange: {
                min: Math.min(...this.sampleParts.map(p => p.price)),
                max: Math.max(...this.sampleParts.map(p => p.price)),
                average: this.sampleParts.reduce((sum, p) => sum + p.price, 0) / this.sampleParts.length
            }
        };

        // Count by category and brand
        this.sampleParts.forEach(part => {
            stats.categories[part.category] = (stats.categories[part.category] || 0) + 1;
            stats.brands[part.brand] = (stats.brands[part.brand] || 0) + 1;
        });

        return stats;
    }

    /**
     * Get popular search terms for testing
     * @returns {Array} Popular search terms
     */
    getPopularSearchTerms() {
        return [
            'Intel Core i7',
            'NVIDIA RTX 4070',
            'AMD Ryzen',
            'DDR5 memory',
            'Samsung SSD',
            'ASUS monitor',
            'Corsair PSU',
            'gaming',
            'workstation',
            'budget'
        ];
    }

    /**
     * Get parts by price range
     * @param {number} minPrice - Minimum price
     * @param {number} maxPrice - Maximum price
     * @returns {Array} Parts in price range
     */
    getPartsByPriceRange(minPrice, maxPrice) {
        return this.sampleParts.filter(part => 
            part.price >= minPrice && part.price <= maxPrice
        );
    }

    /**
     * Get parts by brand
     * @param {string} brand - Brand name
     * @returns {Array} Parts from brand
     */
    getPartsByBrand(brand) {
        const brandLower = brand.toLowerCase();
        return this.sampleParts.filter(part => 
            part.brand.toLowerCase().includes(brandLower)
        );
    }
}

module.exports = MockAPIService;
