const express = require('express');
const router = express.Router();
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const validateRequest = require('../_middleware/validate-request');
const Joi = require('joi');
const controller = require('./approval-request.controller');

// Validation schema for creating approval request
function createApprovalRequestSchema(req, res, next) {
    const schema = Joi.object({
        type: Joi.string().valid('stock', 'dispose').required(),
        requestData: Joi.object().required()
    });
    validateRequest(req, next, schema);
}

// Validation schema for approving request
function approveRequestSchema(req, res, next) {
    const schema = Joi.object({
        remarks: Joi.string().allow('').optional()
    });
    validateRequest(req, next, schema);
}

// Validation schema for rejecting request
function rejectRequestSchema(req, res, next) {
    const schema = Joi.object({
        rejectionReason: Joi.string().required(),
        remarks: Joi.string().allow('')
    });
    validateRequest(req, next, schema);
}

// Test endpoint without authentication
router.get('/test', controller.test);

// Test stock service endpoint
router.get('/test-stock-service', controller.testStockService);

// Test database endpoint
router.get('/test-database', controller.testDatabase);

// Test data flow endpoint
router.get('/test-data-flow', controller.testDataFlow);

// Test stock creation endpoint
router.get('/test-stock-creation', controller.testStockCreation);

// Test approval process endpoint
router.get('/test-approval-process', controller.testApprovalProcess);

// Routes
router.get('/', authorize([Role.SuperAdmin, Role.Admin]), controller.getAll);                    // GET all requests (SuperAdmin/Admin)
router.get('/my', authorize([Role.SuperAdmin, Role.Admin, Role.Staff]), controller.getMyRequests); // GET my requests (All roles)
router.get('/stats/pending', authorize([Role.SuperAdmin, Role.Admin]), controller.getPendingCount); // GET pending count (SuperAdmin/Admin)
router.get('/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Staff]), controller.getById);     // GET request by ID
router.post('/', authorize([Role.SuperAdmin, Role.Admin, Role.Staff]), createApprovalRequestSchema, controller.create); // CREATE request
router.put('/:id/approve', authorize([Role.SuperAdmin, Role.Admin]), approveRequestSchema, controller.approve); // APPROVE request
router.put('/:id/reject', authorize([Role.SuperAdmin, Role.Admin]), rejectRequestSchema, controller.reject);   // REJECT request
router.delete('/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Staff]), controller._delete);               // DELETE request

module.exports = router;
