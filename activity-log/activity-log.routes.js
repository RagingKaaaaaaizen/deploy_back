const express = require('express');
const router = express.Router();
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const activityLogController = require('./activity-log.controller');

// User can view their own activity
router.get('/my-activity', authorize(), activityLogController.getMyActivity);

// Admin can view specific user's activity
router.get('/user/:userId', authorize([Role.Admin, Role.SuperAdmin]), activityLogController.getUserActivity);

// Admin can view all activity
router.get('/', authorize([Role.Admin, Role.SuperAdmin]), activityLogController.getAllActivity);

// Anyone can view entity activity
router.get('/entity/:entityType/:entityId', authorize(), activityLogController.getEntityActivity);

// Admin can view activity by date range
router.get('/date-range', authorize([Role.Admin, Role.SuperAdmin]), activityLogController.getActivityByDateRange);

module.exports = router;
