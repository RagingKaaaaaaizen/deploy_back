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
