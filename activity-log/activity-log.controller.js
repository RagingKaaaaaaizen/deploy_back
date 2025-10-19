const activityLogService = require('./activity-log.service');
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');

// GET user's own activity logs
exports.getMyActivity = (req, res, next) => {
    const { limit = 50, offset = 0, entityType, action, startDate, endDate } = req.query;
    const filters = { entityType, action, startDate, endDate };
    
    activityLogService.getUserActivity(req.user.id, parseInt(limit), parseInt(offset), filters)
        .then(logs => res.json(logs))
        .catch(next);
};

// GET activity logs for a specific user (Admin only)
exports.getUserActivity = (req, res, next) => {
    if (req.user.role !== Role.Admin && req.user.role !== Role.SuperAdmin) {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const { limit = 50, offset = 0, entityType, action, startDate, endDate } = req.query;
    const filters = { entityType, action, startDate, endDate };
    
    activityLogService.getUserActivity(req.params.userId, parseInt(limit), parseInt(offset), filters)
        .then(logs => res.json(logs))
        .catch(next);
};

// GET all activity logs (Admin only)
exports.getAllActivity = (req, res, next) => {
    if (req.user.role !== Role.Admin && req.user.role !== Role.SuperAdmin) {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const { limit = 100, offset = 0, userId, entityType, action, startDate, endDate } = req.query;
    const filters = { userId, entityType, action, startDate, endDate };
    
    activityLogService.getAllActivity(parseInt(limit), parseInt(offset), filters)
        .then(logs => res.json(logs))
        .catch(next);
};

// GET entity activity logs
exports.getEntityActivity = (req, res, next) => {
    const { entityType, entityId } = req.params;
    const { limit = 50 } = req.query;
    
    activityLogService.getEntityActivity(entityType, entityId, parseInt(limit))
        .then(logs => res.json(logs))
        .catch(next);
};

// GET activity logs by date range (Admin only)
exports.getActivityByDateRange = (req, res, next) => {
    if (req.user.role !== Role.Admin && req.user.role !== Role.SuperAdmin) {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const { startDate, endDate, limit = 100, offset = 0 } = req.query;
    
    if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    activityLogService.getActivityByDateRange(startDate, endDate, parseInt(limit), parseInt(offset))
        .then(logs => res.json(logs))
        .catch(next);
};
