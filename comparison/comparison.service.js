const db = require('../_helpers/db');
const pcComponentService = require('../pc/pc-component.service');
const activityLogService = require('../activity-log/activity-log.service');
const apiManager = require('./api-integration/api-manager.service');
const aiManager = require('./ai/ai-manager.service');

module.exports = {
    compareParts,
    getComparisonHistory,
    getPartSpecifications,
    searchOnlineParts,
    getComparisonSuggestions,
    updatePartSpecifications,
    getPartsByCategory,
    getAPIStats,
    explainSpecifications,
    generateUpgradeRecommendation,
    getAIStats
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
        await activityLogService.logActivity({
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
 * @returns {Promise<Object>} Search results with metadata
 */
async function searchOnlineParts(searchParams) {
    const { query, category, limit = 10 } = searchParams;

    try {
        // Use API manager to search across all providers
        const searchResults = await apiManager.searchParts(query, category, limit, {
            maxProviders: 2, // Try up to 2 providers
            timeout: 10000, // 10 second timeout per provider
            deduplicate: true
        });

        return {
            success: true,
            results: searchResults.results,
            metadata: {
                totalFound: searchResults.totalFound,
                providers: searchResults.providers,
                errors: searchResults.errors,
                duplicatesRemoved: searchResults.duplicatesRemoved
            }
        };

    } catch (error) {
        console.error('Error in searchOnlineParts:', error);
        return {
            success: false,
            results: [],
            error: error.message,
            metadata: {
                providers: [],
                errors: [{ provider: 'unknown', error: error.message }]
            }
        };
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
 * @param {string} searchQuery - Optional custom search query
 * @returns {Promise<Object>} Updated specifications
 */
async function updatePartSpecifications(itemId, searchQuery = null) {
    try {
        // Use API manager to update specifications
        const result = await apiManager.updatePartSpecifications(itemId, searchQuery);
        
        return result;

    } catch (error) {
        console.error('Error updating specifications:', error);
        return {
            success: false,
            message: error.message
        };
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
    try {
        // Use AI Manager to generate intelligent comparison
        const aiResult = await aiManager.generateComparison(part1, part2, comparisonResult);
        
        return {
            summary: aiResult.summary,
            recommendation: aiResult.recommendation,
            confidence: aiResult.confidence,
            keyDifferences: aiResult.keyDifferences,
            aiProvider: aiResult.aiProvider,
            processingTime: aiResult.processingTime
        };
        
    } catch (error) {
        console.error('Error generating AI summary:', error);
        
        // Fallback to basic comparison
        const summary = `Comparing ${part1.name} with ${part2.name}. `;
        let recommendation = 'similar';
        let confidence = 0.5;

        if (comparisonResult.winner === 'part1') {
            recommendation = 'part1_better';
            confidence = 0.8;
            summary += `${part1.name} appears to be the better choice based on specifications.`;
        } else if (comparisonResult.winner === 'part2') {
            recommendation = 'part2_better';
            confidence = 0.8;
            summary += `${part2.name} appears to be the better choice based on specifications.`;
        } else {
            summary += `Both parts appear to have similar specifications and performance.`;
            confidence = 0.6;
        }

        return {
            summary,
            recommendation,
            confidence,
            keyDifferences: comparisonResult.differences || [],
            aiProvider: 'fallback',
            processingTime: 0
        };
    }
}

/**
 * Get API manager statistics
 * @returns {Promise<Object>} API statistics
 */
async function getAPIStats() {
    try {
        const [providerStats, cacheStats] = await Promise.all([
            apiManager.getProviderStats(),
            apiManager.getAllCacheStats()
        ]);

        return {
            providers: providerStats,
            cache: cacheStats,
            availableProviders: apiManager.getAvailableProviders()
        };
    } catch (error) {
        console.error('Error getting API stats:', error);
        return {
            providers: {},
            cache: {},
            availableProviders: [],
            error: error.message
        };
    }
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

/**
 * Explain part specifications using AI
 * @param {number} itemId - Item ID
 * @param {string} providerHint - AI provider hint (optional)
 * @returns {Promise<Object>} AI explanation
 */
async function explainSpecifications(itemId, providerHint = null) {
    try {
        const item = await db.Item.findByPk(itemId, {
            include: [
                { model: db.Category, as: 'category' },
                { model: db.Brand, as: 'brand' },
                { model: db.PartSpecification, as: 'specifications' }
            ]
        });

        if (!item) {
            throw new Error('Item not found');
        }

        const part = {
            id: item.id,
            name: item.name,
            brand: item.brand?.name || 'Unknown',
            category: item.category?.name || 'Unknown',
            specifications: item.specifications || []
        };

        const explanation = await aiManager.explainSpecifications(part, part.category, providerHint);

        return {
            success: true,
            itemId: itemId,
            explanation: explanation,
            part: {
                name: part.name,
                brand: part.brand,
                category: part.category
            }
        };

    } catch (error) {
        console.error('Error explaining specifications:', error);
        throw error;
    }
}

/**
 * Generate upgrade recommendation using AI
 * @param {number} currentItemId - Current item ID
 * @param {string} useCase - Use case (gaming, work, etc.)
 * @param {string} providerHint - AI provider hint (optional)
 * @returns {Promise<Object>} AI upgrade recommendation
 */
async function generateUpgradeRecommendation(currentItemId, useCase, providerHint = null) {
    try {
        // Get current part
        const currentItem = await db.Item.findByPk(currentItemId, {
            include: [
                { model: db.Category, as: 'category' },
                { model: db.Brand, as: 'brand' },
                { model: db.PartSpecification, as: 'specifications' }
            ]
        });

        if (!currentItem) {
            throw new Error('Current item not found');
        }

        const currentPart = {
            id: currentItem.id,
            name: currentItem.name,
            brand: currentItem.brand?.name || 'Unknown',
            category: currentItem.category?.name || 'Unknown',
            specifications: currentItem.specifications || []
        };

        // Get available upgrade options (same category, different items)
        const availableItems = await db.Item.findAll({
            where: {
                categoryId: currentItem.categoryId,
                id: { [db.Sequelize.Op.ne]: currentItemId }
            },
            include: [
                { model: db.Category, as: 'category' },
                { model: db.Brand, as: 'brand' },
                { model: db.PartSpecification, as: 'specifications' }
            ],
            limit: 5 // Limit to top 5 options
        });

        const availableParts = availableItems.map(item => ({
            id: item.id,
            name: item.name,
            brand: item.brand?.name || 'Unknown',
            category: item.category?.name || 'Unknown',
            specifications: item.specifications || [],
            price: item.price || null
        }));

        if (availableParts.length === 0) {
            return {
                success: true,
                currentPart: currentPart,
                recommendation: {
                    recommendedPart: null,
                    reason: 'No upgrade options available in the same category',
                    improvement: 'Consider looking at different categories or brands',
                    costBenefit: 'Unable to assess without alternatives',
                    alternatives: []
                },
                availableParts: [],
                useCase: useCase
            };
        }

        const recommendation = await aiManager.generateUpgradeRecommendation(
            currentPart, 
            availableParts, 
            useCase, 
            providerHint
        );

        return {
            success: true,
            currentPart: currentPart,
            recommendation: recommendation,
            availableParts: availableParts,
            useCase: useCase
        };

    } catch (error) {
        console.error('Error generating upgrade recommendation:', error);
        throw error;
    }
}

/**
 * Get AI service statistics
 * @returns {Promise<Object>} AI statistics
 */
async function getAIStats() {
    try {
        const aiStatus = aiManager.getStatus();
        const providerStats = aiManager.getProviderStats();

        return {
            success: true,
            status: aiStatus,
            providers: providerStats,
            availableProviders: aiManager.getAvailableProviders(),
            hasAnyProvider: aiManager.isAnyProviderAvailable()
        };

    } catch (error) {
        console.error('Error getting AI stats:', error);
        throw error;
    }
}
