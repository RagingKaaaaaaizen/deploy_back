const express = require('express');
const router = express.Router();
const analyticsController = require('./analytics.controller');
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');

// All analytics routes require authentication
router.use(authorize());

// Dashboard analytics - available to all authenticated users
router.get('/dashboard', analyticsController.getDashboardAnalytics);

// Category distribution
router.get('/category-distribution', analyticsController.getCategoryDistribution);

// Timeline data
router.get('/stock-timeline', analyticsController.getStockTimeline);
router.get('/disposal-timeline', analyticsController.getDisposalTimeline);

// Recent activity
router.get('/recent-activity', analyticsController.getRecentActivity);

// Stock analysis - available to admin and super admin
router.get('/low-stock-items', authorize([Role.Admin, Role.SuperAdmin]), analyticsController.getLowStockItems);
router.get('/out-of-stock-items', authorize([Role.Admin, Role.SuperAdmin]), analyticsController.getOutOfStockItems);
router.get('/stock-by-location', authorize([Role.Admin, Role.SuperAdmin]), analyticsController.getStockByLocation);

// Monthly reports - available to admin and super admin
router.get('/monthly-stock-additions', authorize([Role.Admin, Role.SuperAdmin]), analyticsController.getMonthlyStockAdditions);
router.get('/monthly-disposals', authorize([Role.Admin, Role.SuperAdmin]), analyticsController.getMonthlyDisposals);

// Report generation - available to all authenticated users
router.post('/generate-report', analyticsController.generateReport);

// Test database connectivity - available to all authenticated users
router.get('/test-database', analyticsController.testDatabase);

module.exports = router;
