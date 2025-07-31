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
        itemId: Joi.number().integer().required(),
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
router.get('/', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), controller.getAll);
router.get('/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), controller.getById);
router.post('/', authorize([Role.SuperAdmin, Role.Admin]), createSchema, controller.create);
router.put('/:id', authorize([Role.SuperAdmin, Role.Admin]), updateSchema, controller.update);
router.delete('/:id', authorize([Role.SuperAdmin, Role.Admin]), controller.delete);
router.get('/item/:itemId', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), controller.getByItem);
router.post('/validate', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), controller.validateDisposal);
router.get('/with-stock/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), controller.getDisposalWithStock);
router.get('/stock-with-disposal/:itemId', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), controller.getStockWithDisposal);
router.get('/test', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), controller.test);

module.exports = router; 