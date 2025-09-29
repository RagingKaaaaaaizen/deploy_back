const comparisonService = require('./comparison.service');

/**
 * Compare two parts
 * POST /api/comparison/compare-parts
 */
exports.compareParts = async (req, res, next) => {
    try {
        const { part1Id, part2Id, comparisonType } = req.body;
        
        // Validate required fields
        if (!part1Id || !part2Id || !comparisonType) {
            return res.status(400).json({
                message: 'Missing required fields: part1Id, part2Id, comparisonType'
            });
        }

        // Validate comparison type
        const validTypes = ['inventory_vs_inventory', 'inventory_vs_pc', 'inventory_vs_online'];
        if (!validTypes.includes(comparisonType)) {
            return res.status(400).json({
                message: 'Invalid comparison type. Must be one of: ' + validTypes.join(', ')
            });
        }

        // Ensure user is authenticated
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: 'User authentication required'
            });
        }

        const result = await comparisonService.compareParts({
            part1Id: parseInt(part1Id),
            part2Id: parseInt(part2Id),
            comparisonType
        }, req.user.id);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Get comparison history for user
 * GET /api/comparison/history
 */
exports.getComparisonHistory = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: 'User authentication required'
            });
        }

        const { limit = 50, offset = 0, comparisonType } = req.query;

        const history = await comparisonService.getComparisonHistory(req.user.id, {
            limit: parseInt(limit),
            offset: parseInt(offset),
            comparisonType
        });

        res.json({
            success: true,
            data: history,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                count: history.length
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Get specifications for a part
 * GET /api/comparison/specifications/:itemId
 */
exports.getPartSpecifications = async (req, res, next) => {
    try {
        const { itemId } = req.params;

        if (!itemId || isNaN(itemId)) {
            return res.status(400).json({
                message: 'Valid itemId is required'
            });
        }

        const specifications = await comparisonService.getPartSpecifications(parseInt(itemId));

        if (!specifications) {
            return res.status(404).json({
                message: 'Part not found'
            });
        }

        res.json({
            success: true,
            data: specifications
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Search for parts online
 * POST /api/comparison/search-online
 */
exports.searchOnlineParts = async (req, res, next) => {
    try {
        const { query, category, limit = 10 } = req.body;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({
                message: 'Search query is required'
            });
        }

        const results = await comparisonService.searchOnlineParts({
            query: query.trim(),
            category,
            limit: parseInt(limit)
        });

        res.json({
            success: true,
            data: results,
            query: query.trim(),
            count: results.length
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Get comparison suggestions for a part
 * GET /api/comparison/suggestions/:itemId
 */
exports.getComparisonSuggestions = async (req, res, next) => {
    try {
        const { itemId } = req.params;

        if (!itemId || isNaN(itemId)) {
            return res.status(400).json({
                message: 'Valid itemId is required'
            });
        }

        const suggestions = await comparisonService.getComparisonSuggestions(parseInt(itemId));

        res.json({
            success: true,
            data: suggestions
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Update part specifications from external sources
 * POST /api/comparison/update-specifications/:itemId
 */
exports.updatePartSpecifications = async (req, res, next) => {
    try {
        const { itemId } = req.params;

        if (!itemId || isNaN(itemId)) {
            return res.status(400).json({
                message: 'Valid itemId is required'
            });
        }

        // Ensure user is authenticated
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: 'User authentication required'
            });
        }

        const result = await comparisonService.updatePartSpecifications(parseInt(itemId));

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Get parts by category
 * GET /api/comparison/category/:categoryName
 */
exports.getPartsByCategory = async (req, res, next) => {
    try {
        const { categoryName } = req.params;

        if (!categoryName || categoryName.trim().length === 0) {
            return res.status(400).json({
                message: 'Category name is required'
            });
        }

        const parts = await comparisonService.getPartsByCategory(categoryName.trim());

        res.json({
            success: true,
            data: parts,
            category: categoryName.trim(),
            count: parts.length
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Get comparison statistics
 * GET /api/comparison/stats
 */
exports.getComparisonStats = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: 'User authentication required'
            });
        }

        // Get user's comparison statistics
        const history = await comparisonService.getComparisonHistory(req.user.id, { limit: 1000 });
        
        const stats = {
            totalComparisons: history.length,
            comparisonsByType: {},
            recentComparisons: history.slice(0, 5).map(comp => ({
                id: comp.id,
                part1Name: comp.part1?.name,
                part2Name: comp.part2?.name,
                comparisonType: comp.comparisonType,
                createdAt: comp.createdAt
            }))
        };

        // Count by comparison type
        history.forEach(comp => {
            stats.comparisonsByType[comp.comparisonType] = 
                (stats.comparisonsByType[comp.comparisonType] || 0) + 1;
        });

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Delete comparison history entry
 * DELETE /api/comparison/history/:id
 */
exports.deleteComparisonHistory = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                message: 'Valid comparison ID is required'
            });
        }

        // Ensure user is authenticated
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: 'User authentication required'
            });
        }

        // Check if the comparison belongs to the user
        const db = require('../_helpers/db');
        const comparison = await db.ComparisonHistory.findOne({
            where: { id: parseInt(id), userId: req.user.id }
        });

        if (!comparison) {
            return res.status(404).json({
                message: 'Comparison not found or access denied'
            });
        }

        await comparison.destroy();

        res.json({
            success: true,
            message: 'Comparison history deleted successfully'
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Get API statistics and health
 * GET /api/comparison/api-stats
 */
exports.getAPIStats = async (req, res, next) => {
    try {
        // Ensure user is authenticated and has admin role
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: 'User authentication required'
            });
        }

        // Check if user is admin (SuperAdmin or Admin)
        if (req.user.role !== 'Admin' && req.user.role !== 'SuperAdmin') {
            return res.status(403).json({
                message: 'Admin access required'
            });
        }

        const stats = await comparisonService.getAPIStats();

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Reset API provider health status
 * POST /api/comparison/reset-provider-health
 */
exports.resetProviderHealth = async (req, res, next) => {
    try {
        // Ensure user is authenticated and has admin role
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: 'User authentication required'
            });
        }

        if (req.user.role !== 'Admin' && req.user.role !== 'SuperAdmin') {
            return res.status(403).json({
                message: 'Admin access required'
            });
        }

        const { provider: providerName } = req.body;
        const apiManager = require('./api-integration/api-manager.service');

        apiManager.resetProviderHealth(providerName);

        res.json({
            success: true,
            message: providerName 
                ? `Reset health status for provider: ${providerName}`
                : 'Reset health status for all providers'
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Clean expired cache entries
 * POST /api/comparison/clean-cache
 */
exports.cleanCache = async (req, res, next) => {
    try {
        // Ensure user is authenticated and has admin role
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: 'User authentication required'
            });
        }

        if (req.user.role !== 'Admin' && req.user.role !== 'SuperAdmin') {
            return res.status(403).json({
                message: 'Admin access required'
            });
        }

        const apiManager = require('./api-integration/api-manager.service');
        const results = await apiManager.cleanAllCaches();

        res.json({
            success: true,
            message: 'Cache cleanup completed',
            data: results
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Explain part specifications using AI
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const explainSpecifications = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const { providerHint } = req.query;

        if (!itemId) {
            return res.status(400).json({
                message: 'Item ID is required'
            });
        }

        const comparisonService = require('./comparison.service');
        const result = await comparisonService.explainSpecifications(itemId, providerHint);

        res.json(result);

    } catch (error) {
        next(error);
    }
};

/**
 * Generate upgrade recommendation using AI
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const generateUpgradeRecommendation = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const { useCase, providerHint } = req.body;

        if (!itemId) {
            return res.status(400).json({
                message: 'Item ID is required'
            });
        }

        if (!useCase) {
            return res.status(400).json({
                message: 'Use case is required (e.g., gaming, work, general)'
            });
        }

        const comparisonService = require('./comparison.service');
        const result = await comparisonService.generateUpgradeRecommendation(itemId, useCase, providerHint);

        res.json(result);

    } catch (error) {
        next(error);
    }
};

/**
 * Get AI service statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getAIStats = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: 'User authentication required'
            });
        }

        if (req.user.role !== 'Admin' && req.user.role !== 'SuperAdmin') {
            return res.status(403).json({
                message: 'Admin access required'
            });
        }

        const comparisonService = require('./comparison.service');
        const result = await comparisonService.getAIStats();

        res.json(result);

    } catch (error) {
        next(error);
    }
};

/**
 * Reset AI provider health status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const resetAIProviderHealth = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: 'User authentication required'
            });
        }

        if (req.user.role !== 'Admin' && req.user.role !== 'SuperAdmin') {
            return res.status(403).json({
                message: 'Admin access required'
            });
        }

        const { provider } = req.body;

        const aiManager = require('./ai/ai-manager.service');
        aiManager.resetProviderHealth(provider);

        res.json({
            success: true,
            message: provider ? `AI provider ${provider} health reset` : 'All AI providers health reset'
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    compareParts: exports.compareParts,
    getComparisonHistory: exports.getComparisonHistory,
    getPartSpecifications: exports.getPartSpecifications,
    searchOnlineParts: exports.searchOnlineParts,
    getComparisonSuggestions: exports.getComparisonSuggestions,
    updatePartSpecifications: exports.updatePartSpecifications,
    getPartsByCategory: exports.getPartsByCategory,
    getStats: exports.getComparisonStats,
    getAPIStats: exports.getAPIStats,
    resetProviderHealth: exports.resetProviderHealth,
    cleanCache: exports.cleanCache,
    deleteComparisonHistory: exports.deleteComparisonHistory,
    explainSpecifications,
    generateUpgradeRecommendation,
    getAIStats,
    resetAIProviderHealth
};
