const express = require('express');
const router = express.Router();
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const validateRequest = require('../_middleware/validate-request');
const Joi = require('joi');
const controller = require('./stock.controller');

// Validation schema for adding stock
function addStockSchema(req, res, next) {
    const schema = Joi.object({
        itemId: Joi.number().required(),
        quantity: Joi.number().required(),
        locationId: Joi.number().required(),                   // FOREIGN KEY to StorageLocation
        price: Joi.number().required(),                        // NEW FIELD: price
        remarks: Joi.string().allow(''),
        disposeId: Joi.number().optional()                     // Optional link to disposal record
    });
    validateRequest(req, next, schema);
}

// Validation schema for updating stock
function updateStockSchema(req, res, next) {
    const schema = Joi.object({
        quantity: Joi.number().required(),
        locationId: Joi.number().required(),
        price: Joi.number().required(),                        // allow updating price
        remarks: Joi.string().allow('')
    });
    validateRequest(req, next, schema);
}

// Routes
router.get('/', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), controller.getLogs);                                   // GET all stock logs
router.get('/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), controller.getById);                                // GET single stock log
router.get('/available/:itemId', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), controller.getAvailableStock);        // GET available stock for item
router.post('/', authorize([Role.SuperAdmin, Role.Admin]), addStockSchema, controller.addStock);      // CREATE stock
router.put('/:id', authorize([Role.SuperAdmin, Role.Admin]), updateStockSchema, controller.updateStock); // UPDATE stock
router.delete('/:id', authorize([Role.SuperAdmin, Role.Admin]), controller._delete);                   // DELETE stock

module.exports = router;
