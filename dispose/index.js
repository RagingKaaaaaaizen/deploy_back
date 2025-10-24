const express = require('express');
const router = express.Router();
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const validateRequest = require('../_middleware/validate-request');
const Joi = require('joi');
const controller = require('./dispose.controller');

// Validation schemas
function createSchema(req, res, next) {
    const schema = Joi.object({
        stockEntryId: Joi.number().integer().required(),
        quantity: Joi.number().integer().min(1).required(),
        disposalValue: Joi.number().precision(2).min(0).optional().default(0),
        locationId: Joi.number().integer().required(),
        reason: Joi.string().allow('').optional()
    });
    validateRequest(req, next, schema);
}

function updateSchema(req, res, next) {
    const schema = Joi.object({
        quantity: Joi.number().integer().min(1).optional(),
        disposalValue: Joi.number().precision(2).min(0).optional(),
        locationId: Joi.number().optional(),
        reason: Joi.string().optional()
    });
    validateRequest(req, next, schema);
}

// Routes
router.get('/', authorize([Role.SuperAdmin, Role.Admin, Role.Staff, Role.Viewer]), controller.getAll);
router.get('/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Staff, Role.Viewer]), controller.getById);
router.post('/', authorize([Role.SuperAdmin, Role.Admin, Role.Staff]), createSchema, controller.create);
router.put('/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Staff]), updateSchema, controller.update);
router.delete('/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Staff]), controller.delete);
router.get('/item/:itemId', authorize([Role.SuperAdmin, Role.Admin, Role.Staff, Role.Viewer]), controller.getByItem);
router.post('/validate', authorize([Role.SuperAdmin, Role.Admin, Role.Staff, Role.Viewer]), controller.validateDisposal);
router.get('/with-stock/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Staff, Role.Viewer]), controller.getDisposalWithStock);
router.get('/stock-with-disposal/:itemId', authorize([Role.SuperAdmin, Role.Admin, Role.Staff, Role.Viewer]), controller.getStockWithDisposal);
// Temporarily remove authentication for testing
router.post('/:id/return-to-stock', controller.returnToStock);
router.post('/:id/return-to-stock-partial', controller.returnToStockPartial);
// Admin-only endpoint to fix disposal values
router.post('/fix-disposal-values', authorize([Role.SuperAdmin, Role.Admin]), controller.fixDisposalValues);
// Test endpoint without authentication
router.get('/test', controller.test);

module.exports = router; 