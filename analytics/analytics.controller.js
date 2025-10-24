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

// GET item lifespans
exports.getItemLifespans = (req, res, next) => {
    const months = parseInt(req.query.months) || 12;
    analyticsService.getItemLifespans(months)
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
            console.error('Error stack:', error.stack);
            next(error);
        });
};

// GET test database connectivity
exports.testDatabase = (req, res, next) => {
    console.log('=== TESTING DATABASE CONNECTIVITY ===');
    
    const db = require('../_helpers/db');
    console.log('Available models:', Object.keys(db));
    
    // Test basic database query
    db.Stock.findAll({ limit: 1 })
        .then(result => {
            console.log('Database test successful:', result.length, 'stocks found');
            res.json({ 
                success: true, 
                message: 'Database connectivity test successful',
                availableModels: Object.keys(db),
                sampleData: result.length
            });
        })
        .catch(error => {
            console.error('Database test failed:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Database connectivity test failed',
                error: error.message,
                stack: error.stack
            });
        });
};

// Enhanced Analytics Controllers

// GET top-used categories
exports.getTopUsedCategories = (req, res, next) => {
    const limit = parseInt(req.query.limit) || 10;
    analyticsService.getTopUsedCategories(limit)
        .then(data => res.json(data))
        .catch(next);
};

// GET most replaced components
exports.getMostReplacedComponents = (req, res, next) => {
    const limit = parseInt(req.query.limit) || 10;
    analyticsService.getMostReplacedComponents(limit)
        .then(data => res.json(data))
        .catch(next);
};

// GET average component lifespan
exports.getAverageComponentLifespan = (req, res, next) => {
    analyticsService.getAverageComponentLifespan()
        .then(data => res.json(data))
        .catch(next);
};

// GET component replacement patterns
exports.getComponentReplacementPatterns = (req, res, next) => {
    analyticsService.getComponentReplacementPatterns()
        .then(data => res.json(data))
        .catch(next);
};

// GET comprehensive advanced analytics
exports.getAdvancedAnalytics = (req, res, next) => {
    analyticsService.getAdvancedAnalytics()
        .then(data => res.json(data))
        .catch(next);
};

// GET pending requests
exports.getPendingRequests = (req, res, next) => {
    analyticsService.getPendingRequests()
        .then(data => res.json(data))
        .catch(next);
};

// GET automated report schedule
exports.getAutomatedReportSchedule = (req, res, next) => {
    analyticsService.getAutomatedReportSchedule()
        .then(data => res.json(data))
        .catch(next);
};

// POST set automated report schedule
exports.setAutomatedReportSchedule = (req, res, next) => {
    const schedule = req.body;
    analyticsService.setAutomatedReportSchedule(schedule)
        .then(data => res.json(data))
        .catch(next);
};

// POST generate comprehensive report
exports.generateReport = (req, res, next) => {
    const request = req.body;
    analyticsService.generateReport(request)
        .then(data => res.json(data))
        .catch(next);
};