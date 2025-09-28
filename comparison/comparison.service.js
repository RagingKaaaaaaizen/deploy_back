const db = require('../_helpers/db');
const pcComponentService = require('../pc/pc-component.service');
const activityLogService = require('../activity-log/activity-log.service');

module.exports = {
    compareParts,
    getComparisonHistory,
    getPartSpecifications,
    searchOnlineParts,
    getComparisonSuggestions,
    updatePartSpecifications,
    getPartsByCategory
};

/**
 * Compare two parts and generate AI-powered comparison
 * @param {Object} params - Comparison parameters
 * @param {number} params.part1Id - First part ID
 * @param {number} params.part2Id - Second part ID
 * @param {string} params.comparisonType - Type of comparison
 * @param {number} userId - User performing the comparison
 * @returns {Promise<Object>} Comparison result with AI summary
 */
async function compareParts(params, userId) {
    const { part1Id, part2Id, comparisonType } = params;

    try {
        // Get both parts with their specifications
        const [part1, part2] = await Promise.all([
            getPartWithSpecifications(part1Id),
            getPartWithSpecifications(part2Id)
        ]);

        if (!part1 || !part2) {
            throw new Error('One or both parts not found');
        }

        // Perform technical comparison
        const comparisonResult = await performTechnicalComparison(part1, part2);

        // Generate AI summary
        const aiSummary = await generateAISummary(part1, part2, comparisonResult);

        // Save comparison to history
        const comparisonHistory = await db.ComparisonHistory.create({
            userId,
            part1Id,
            part2Id,
            comparisonType,
            comparisonResult,
            aiSummary: aiSummary.summary,
            aiRecommendation: aiSummary.recommendation,
            confidence: aiSummary.confidence
        });

        // Log activity
        await activityLogService.create({
            userId,
            action: 'COMPARE_PARTS',
            entityType: 'Comparison',
            entityId: comparisonHistory.id,
            details: `Compared ${part1.name} with ${part2.name}`
        });

        return {
            id: comparisonHistory.id,
            part1,
            part2,
            comparisonResult,
            aiSummary: aiSummary.summary,
            aiRecommendation: aiSummary.recommendation,
            confidence: aiSummary.confidence,
            createdAt: comparisonHistory.createdAt
        };

    } catch (error) {
        console.error('Error in compareParts:', error);
        throw error;
    }
}

/**
 * Get comparison history for a user
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of comparison history records
 */
async function getComparisonHistory(userId, options = {}) {
    const { limit = 50, offset = 0, comparisonType } = options;

    const whereClause = { userId };
    if (comparisonType) {
        whereClause.comparisonType = comparisonType;
    }

    return await db.ComparisonHistory.findAll({
        where: whereClause,
        include: [
            { model: db.Item, as: 'part1', attributes: ['id', 'name', 'description'] },
            { model: db.Item, as: 'part2', attributes: ['id', 'name', 'description'] },
            { model: db.Account, as: 'user', attributes: ['id', 'firstName', 'lastName'] }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
    });
}

/**
 * Get specifications for a part
 * @param {number} itemId - Item ID
 * @returns {Promise<Object>} Part with specifications
 */
async function getPartSpecifications(itemId) {
    return await getPartWithSpecifications(itemId);
}

/**
 * Search for parts online using external APIs
 * @param {Object} searchParams - Search parameters
 * @param {string} searchParams.query - Search query
 * @param {string} searchParams.category - Part category
 * @param {number} searchParams.limit - Result limit
 * @returns {Promise<Array>} Array of found parts
 */
async function searchOnlineParts(searchParams) {
    const { query, category, limit = 10 } = searchParams;

    try {
        // Try multiple API sources
        const results = await Promise.allSettled([
            searchPCPartPicker(query, category, limit),
            searchAmazonAPI(query, category, limit),
            searchNeweggAPI(query, category, limit)
        ]);

        // Combine and deduplicate results
        const allResults = results
            .filter(result => result.status === 'fulfilled')
            .flatMap(result => result.value)
            .slice(0, limit);

        return deduplicateResults(allResults);

    } catch (error) {
        console.error('Error in searchOnlineParts:', error);
        throw error;
    }
}

/**
 * Get parts that could be compared with the given part
 * @param {number} itemId - Item ID
 * @returns {Promise<Array>} Array of suggested parts for comparison
 */
async function getComparisonSuggestions(itemId) {
    // Get the target part
    const targetPart = await db.Item.findByPk(itemId, {
        include: [
            { model: db.Category, as: 'category' },
            { model: db.Brand, as: 'brand' }
        ]
    });

    if (!targetPart) {
        throw new Error('Part not found');
    }

    // Find similar parts in the same category
    const suggestions = await db.Item.findAll({
        where: {
            categoryId: targetPart.categoryId,
            id: { [db.Sequelize.Op.ne]: itemId }
        },
        include: [
            { model: db.Category, as: 'category' },
            { model: db.Brand, as: 'brand' }
        ],
        limit: 10
    });

    // Get parts from PCs that could be compared
    const pcComponents = await pcComponentService.getByItemId(itemId);

    return {
        suggestions,
        pcComponents: pcComponents.map(comp => comp.pc)
    };
}

/**
 * Update part specifications from external sources
 * @param {number} itemId - Item ID
 * @returns {Promise<Object>} Updated specifications
 */
async function updatePartSpecifications(itemId) {
    const item = await db.Item.findByPk(itemId, {
        include: [
            { model: db.Brand, as: 'brand' },
            { model: db.Category, as: 'category' }
        ]
    });

    if (!item) {
        throw new Error('Item not found');
    }

    try {
        // Search for specifications online
        const searchQuery = `${item.brand.name} ${item.name}`;
        const onlineSpecs = await searchOnlineParts({ query: searchQuery, limit: 1 });

        if (onlineSpecs.length > 0) {
            const specs = onlineSpecs[0].specifications;
            
            // Save specifications to database
            for (const [specName, specValue] of Object.entries(specs)) {
                await db.PartSpecification.upsert({
                    itemId,
                    specName,
                    specValue: String(specValue),
                    source: 'api',
                    confidence: 0.8,
                    lastUpdated: new Date()
                });
            }

            return { success: true, specifications: specs };
        }

        return { success: false, message: 'No specifications found online' };

    } catch (error) {
        console.error('Error updating specifications:', error);
        throw error;
    }
}

/**
 * Get parts by category for comparison
 * @param {string} categoryName - Category name
 * @returns {Promise<Array>} Array of parts in the category
 */
async function getPartsByCategory(categoryName) {
    return await db.Item.findAll({
        include: [
            { 
                model: db.Category, 
                as: 'category',
                where: { name: categoryName }
            },
            { model: db.Brand, as: 'brand' }
        ]
    });
}

// =============================================
// PRIVATE HELPER FUNCTIONS
// =============================================

/**
 * Get part with specifications
 * @param {number} itemId - Item ID
 * @returns {Promise<Object>} Part with specifications
 */
async function getPartWithSpecifications(itemId) {
    const item = await db.Item.findByPk(itemId, {
        include: [
            { model: db.Category, as: 'category' },
            { model: db.Brand, as: 'brand' }
        ]
    });

    if (!item) {
        return null;
    }

    const specifications = await db.PartSpecification.findAll({
        where: { itemId },
        order: [['confidence', 'DESC'], ['specName', 'ASC']]
    });

    return {
        ...item.toJSON(),
        specifications: specifications.map(spec => ({
            name: spec.specName,
            value: spec.specValue,
            unit: spec.specUnit,
            source: spec.source,
            confidence: spec.confidence
        }))
    };
}

/**
 * Perform technical comparison between two parts
 * @param {Object} part1 - First part
 * @param {Object} part2 - Second part
 * @returns {Promise<Object>} Technical comparison result
 */
async function performTechnicalComparison(part1, part2) {
    const comparison = {
        category: part1.category.name,
        specs: {},
        winner: null,
        differences: []
    };

    // Create specification maps for easier comparison
    const specs1 = createSpecMap(part1.specifications);
    const specs2 = createSpecMap(part2.specifications);

    // Compare common specifications
    const commonSpecs = Object.keys(specs1).filter(spec => specs2[spec]);

    for (const specName of commonSpecs) {
        const spec1 = specs1[specName];
        const spec2 = specs2[specName];
        
        comparison.specs[specName] = {
            part1: spec1,
            part2: spec2,
            winner: compareSpecValues(spec1, spec2, specName)
        };

        if (comparison.specs[specName].winner !== 'tie') {
            comparison.differences.push({
                spec: specName,
                winner: comparison.specs[specName].winner,
                difference: calculateDifference(spec1, spec2, specName)
            });
        }
    }

    // Determine overall winner
    comparison.winner = determineOverallWinner(comparison.differences);

    return comparison;
}

/**
 * Generate AI summary for comparison
 * @param {Object} part1 - First part
 * @param {Object} part2 - Second part
 * @param {Object} comparisonResult - Technical comparison result
 * @returns {Promise<Object>} AI summary with recommendation
 */
async function generateAISummary(part1, part2, comparisonResult) {
    // This is a placeholder for AI integration
    // In Phase 3, this will be replaced with actual AI service calls
    
    const summary = `Comparing ${part1.name} with ${part2.name}. `;
    let recommendation = 'similar';
    let confidence = 0.5;

    if (comparisonResult.winner === 'part1') {
        recommendation = 'part1_better';
        confidence = 0.8;
    } else if (comparisonResult.winner === 'part2') {
        recommendation = 'part2_better';
        confidence = 0.8;
    }

    return {
        summary,
        recommendation,
        confidence
    };
}

/**
 * Search PCPartPicker for parts
 * @param {string} query - Search query
 * @param {string} category - Part category
 * @param {number} limit - Result limit
 * @returns {Promise<Array>} Search results
 */
async function searchPCPartPicker(query, category, limit) {
    // Placeholder for PCPartPicker API integration
    // This will be implemented in Phase 2
    return [];
}

/**
 * Search Amazon API for parts
 * @param {string} query - Search query
 * @param {string} category - Part category
 * @param {number} limit - Result limit
 * @returns {Promise<Array>} Search results
 */
async function searchAmazonAPI(query, category, limit) {
    // Placeholder for Amazon API integration
    // This will be implemented in Phase 2
    return [];
}

/**
 * Search Newegg API for parts
 * @param {string} query - Search query
 * @param {string} category - Part category
 * @param {number} limit - Result limit
 * @returns {Promise<Array>} Search results
 */
async function searchNeweggAPI(query, category, limit) {
    // Placeholder for Newegg API integration
    // This will be implemented in Phase 2
    return [];
}

/**
 * Create specification map for easier comparison
 * @param {Array} specifications - Array of specifications
 * @returns {Object} Specification map
 */
function createSpecMap(specifications) {
    const map = {};
    specifications.forEach(spec => {
        map[spec.name] = spec;
    });
    return map;
}

/**
 * Compare specification values
 * @param {Object} spec1 - First specification
 * @param {Object} spec2 - Second specification
 * @param {string} specName - Specification name
 * @returns {string} Winner ('part1', 'part2', or 'tie')
 */
function compareSpecValues(spec1, spec2, specName) {
    // This is a simplified comparison logic
    // In a real implementation, this would be more sophisticated
    
    const value1 = parseFloat(spec1.value) || 0;
    const value2 = parseFloat(spec2.value) || 0;

    if (value1 > value2) return 'part1';
    if (value2 > value1) return 'part2';
    return 'tie';
}

/**
 * Calculate difference between specifications
 * @param {Object} spec1 - First specification
 * @param {Object} spec2 - Second specification
 * @param {string} specName - Specification name
 * @returns {number} Difference percentage
 */
function calculateDifference(spec1, spec2, specName) {
    const value1 = parseFloat(spec1.value) || 0;
    const value2 = parseFloat(spec2.value) || 0;
    
    if (value1 === 0 || value2 === 0) return 0;
    
    return Math.abs((value1 - value2) / Math.max(value1, value2)) * 100;
}

/**
 * Determine overall winner from differences
 * @param {Array} differences - Array of specification differences
 * @returns {string} Overall winner
 */
function determineOverallWinner(differences) {
    const part1Wins = differences.filter(diff => diff.winner === 'part1').length;
    const part2Wins = differences.filter(diff => diff.winner === 'part2').length;
    
    if (part1Wins > part2Wins) return 'part1';
    if (part2Wins > part1Wins) return 'part2';
    return 'tie';
}

/**
 * Deduplicate search results
 * @param {Array} results - Array of search results
 * @returns {Array} Deduplicated results
 */
function deduplicateResults(results) {
    const seen = new Set();
    return results.filter(result => {
        const key = `${result.name}_${result.brand}`;
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}
