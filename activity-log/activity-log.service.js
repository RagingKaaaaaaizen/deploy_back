const db = require('../_helpers/db');

module.exports = {
    logActivity,
    getUserActivity,
    getEntityActivity,
    getAllActivity,
    getActivityByDateRange
};

async function logActivity(params) {
    const {
        userId,
        action,
        entityType,
        entityId,
        entityName,
        details,
        ipAddress,
        userAgent
    } = params;

    if (!userId || !action || !entityType) {
        throw 'Required parameters missing';
    }

    const logData = {
        userId,
        action,
        entityType,
        entityId,
        entityName,
        details: details || {},
        ipAddress,
        userAgent
    };

    return await db.ActivityLog.create(logData);
}

async function getUserActivity(userId, limit = 50, offset = 0) {
    return await db.ActivityLog.findAll({
        where: { userId },
        include: [
            { model: db.Account, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
    });
}

async function getEntityActivity(entityType, entityId, limit = 50) {
    return await db.ActivityLog.findAll({
        where: { entityType, entityId },
        include: [
            { model: db.Account, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }
        ],
        order: [['createdAt', 'DESC']],
        limit
    });
}

async function getAllActivity(limit = 100, offset = 0, filters = {}) {
    const whereClause = {};
    
    if (filters.userId) whereClause.userId = filters.userId;
    if (filters.entityType) whereClause.entityType = filters.entityType;
    if (filters.action) whereClause.action = filters.action;
    
    return await db.ActivityLog.findAll({
        where: whereClause,
        include: [
            { model: db.Account, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
    });
}

async function getActivityByDateRange(startDate, endDate, limit = 100, offset = 0) {
    return await db.ActivityLog.findAll({
        where: {
            createdAt: {
                [db.Sequelize.Op.between]: [startDate, endDate]
            }
        },
        include: [
            { model: db.Account, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
    });
}
