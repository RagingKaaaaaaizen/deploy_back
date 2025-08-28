const analyticsService = require('./analytics.service');
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');

// GET dashboard analytics
exports.getDashboardAnalytics = (req, res, next) => {
    analyticsService.getDashboardAnalytics()
        .then(data => res.json(data))
        .catch(next);
};

// GET category distribution
exports.getCategoryDistribution = (req, res, next) => {
    analyticsService.getCategoryDistribution()
        .then(data => res.json(data))
        .catch(next);
};

// GET stock timeline data
exports.getStockTimeline = (req, res, next) => {
    const days = parseInt(req.query.days) || 30;
    analyticsService.getStockTimeline(days)
        .then(data => res.json(data))
        .catch(next);
};

// GET disposal timeline data
exports.getDisposalTimeline = (req, res, next) => {
    const days = parseInt(req.query.days) || 30;
    analyticsService.getDisposalTimeline(days)
        .then(data => res.json(data))
        .catch(next);
};

// GET recent activity
exports.getRecentActivity = (req, res, next) => {
    const limit = parseInt(req.query.limit) || 10;
    analyticsService.getRecentActivity(limit)
        .then(data => res.json(data))
        .catch(next);
};

// GET low stock items
exports.getLowStockItems = (req, res, next) => {
    const threshold = parseInt(req.query.threshold) || 10;
    analyticsService.getLowStockItems(threshold)
        .then(data => res.json(data))
        .catch(next);
};

// GET out of stock items
exports.getOutOfStockItems = (req, res, next) => {
    analyticsService.getOutOfStockItems()
        .then(data => res.json(data))
        .catch(next);
};

// GET stock by location
exports.getStockByLocation = (req, res, next) => {
    analyticsService.getStockByLocation()
        .then(data => res.json(data))
        .catch(next);
};

// GET monthly stock additions
exports.getMonthlyStockAdditions = (req, res, next) => {
    const months = parseInt(req.query.months) || 12;
    analyticsService.getMonthlyStockAdditions(months)
        .then(data => res.json(data))
        .catch(next);
};

// GET monthly disposals
exports.getMonthlyDisposals = (req, res, next) => {
    const months = parseInt(req.query.months) || 12;
    analyticsService.getMonthlyDisposals(months)
        .then(data => res.json(data))
        .catch(next);
};

// POST generate report
exports.generateReport = (req, res, next) => {
    console.log('=== GENERATE REPORT REQUEST ===');
    console.log('Request body:', req.body);
    
    const { startDate, endDate, includeStocks, includeDisposals, includePCs } = req.body;
    
    // Validate required fields
    if (!startDate || !endDate) {
        return res.status(400).send({ message: 'Start date and end date are required' });
    }
    
    const request = {
        startDate,
        endDate,
        includeStocks: includeStocks !== false, // Default to true if not specified
        includeDisposals: includeDisposals !== false,
        includePCs: includePCs !== false
    };
    
    analyticsService.generateReport(request)
        .then(data => {
            console.log('Report generated successfully');
            res.json(data);
        })
        .catch(error => {
            console.error('Error generating report:', error);
            next(error);
        });
};
