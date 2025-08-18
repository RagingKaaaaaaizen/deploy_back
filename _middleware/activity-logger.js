const activityLogService = require('../activity-log/activity-log.service');

module.exports = function logActivity(action, entityType, getEntityName = null) {
    return async (req, res, next) => {
        const originalSend = res.send;
        
        res.send = function(data) {
            // Log activity after successful response
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    const entityId = req.params.id || req.body.id;
                    let entityName = null;
                    
                    if (getEntityName && data) {
                        entityName = getEntityName(data);
                    }
                    
                    // Only log if user is authenticated
                    if (req.user && req.user.id) {
                        activityLogService.logActivity({
                            userId: req.user.id,
                            action,
                            entityType,
                            entityId,
                            entityName,
                            details: {
                                method: req.method,
                                path: req.path,
                                body: req.body,
                                params: req.params
                            },
                            ipAddress: req.ip,
                            userAgent: req.get('User-Agent')
                        }).catch(error => {
                            console.error('Failed to log activity:', error);
                        });
                    }
                } catch (error) {
                    console.error('Failed to log activity:', error);
                }
            }
            
            originalSend.call(this, data);
        };
        
        next();
    };
};
