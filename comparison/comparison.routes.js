const express = require('express');
const router = express.Router();
const comparisonController = require('./comparison.controller');
const authorize = require('../_middleware/authorize');
const validateRequest = require('../_middleware/validate-request');
const { body, param, query } = require('express-validator');

// =============================================
// ROUTE DEFINITIONS
// =============================================

/**
 * Compare two parts
 * POST /api/comparison/compare-parts
 */
router.post('/compare-parts', 
    authorize(),
    [
        body('part1Id').isInt({ min: 1 }).withMessage('part1Id must be a positive integer'),
        body('part2Id').isInt({ min: 1 }).withMessage('part2Id must be a positive integer'),
        body('comparisonType').isIn(['inventory_vs_inventory', 'inventory_vs_pc', 'inventory_vs_online'])
            .withMessage('comparisonType must be one of: inventory_vs_inventory, inventory_vs_pc, inventory_vs_online')
    ],
    validateRequest,
    comparisonController.compareParts
);

/**
 * Get comparison history for user
 * GET /api/comparison/history
 */
router.get('/history',
    authorize(),
    [
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
        query('offset').optional().isInt({ min: 0 }).withMessage('offset must be a non-negative integer'),
        query('comparisonType').optional().isIn(['inventory_vs_inventory', 'inventory_vs_pc', 'inventory_vs_online'])
            .withMessage('comparisonType must be one of: inventory_vs_inventory, inventory_vs_pc, inventory_vs_online')
    ],
    validateRequest,
    comparisonController.getComparisonHistory
);

/**
 * Get specifications for a part
 * GET /api/comparison/specifications/:itemId
 */
router.get('/specifications/:itemId',
    authorize(),
    [
        param('itemId').isInt({ min: 1 }).withMessage('itemId must be a positive integer')
    ],
    validateRequest,
    comparisonController.getPartSpecifications
);

/**
 * Search for parts online
 * POST /api/comparison/search-online
 */
router.post('/search-online',
    authorize(),
    [
        body('query').notEmpty().trim().isLength({ min: 1, max: 200 })
            .withMessage('query must be between 1 and 200 characters'),
        body('category').optional().trim().isLength({ max: 100 })
            .withMessage('category must be less than 100 characters'),
        body('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50')
    ],
    validateRequest,
    comparisonController.searchOnlineParts
);

/**
 * Get comparison suggestions for a part
 * GET /api/comparison/suggestions/:itemId
 */
router.get('/suggestions/:itemId',
    authorize(),
    [
        param('itemId').isInt({ min: 1 }).withMessage('itemId must be a positive integer')
    ],
    validateRequest,
    comparisonController.getComparisonSuggestions
);

/**
 * Update part specifications from external sources
 * POST /api/comparison/update-specifications/:itemId
 */
router.post('/update-specifications/:itemId',
    authorize(),
    [
        param('itemId').isInt({ min: 1 }).withMessage('itemId must be a positive integer')
    ],
    validateRequest,
    comparisonController.updatePartSpecifications
);

/**
 * Get parts by category
 * GET /api/comparison/category/:categoryName
 */
router.get('/category/:categoryName',
    authorize(),
    [
        param('categoryName').notEmpty().trim().isLength({ min: 1, max: 100 })
            .withMessage('categoryName must be between 1 and 100 characters')
    ],
    validateRequest,
    comparisonController.getPartsByCategory
);

/**
 * Get comparison statistics
 * GET /api/comparison/stats
 */
router.get('/stats',
    authorize(),
    comparisonController.getComparisonStats
);

/**
 * Delete comparison history entry
 * DELETE /api/comparison/history/:id
 */
router.delete('/history/:id',
    authorize(),
    [
        param('id').isInt({ min: 1 }).withMessage('comparison ID must be a positive integer')
    ],
    validateRequest,
    comparisonController.deleteComparisonHistory
);

// =============================================
// HEALTH CHECK ENDPOINT
// =============================================

/**
 * Health check for comparison service
 * GET /api/comparison/health
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Comparison service is healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// =============================================
// ERROR HANDLING MIDDLEWARE
// =============================================

// Handle 404 for comparison routes
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Comparison API endpoint not found',
        availableEndpoints: [
            'POST /api/comparison/compare-parts',
            'GET /api/comparison/history',
            'GET /api/comparison/specifications/:itemId',
            'POST /api/comparison/search-online',
            'GET /api/comparison/suggestions/:itemId',
            'POST /api/comparison/update-specifications/:itemId',
            'GET /api/comparison/category/:categoryName',
            'GET /api/comparison/stats',
            'DELETE /api/comparison/history/:id',
            'GET /api/comparison/health'
        ]
    });
});

module.exports = router;
