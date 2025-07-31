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
        type: Joi.string().valid('ADD', 'DISPOSE').required(), // match model ENUM
        locationId: Joi.number().required(),                   // FOREIGN KEY to StorageLocation
        price: Joi.number().required(),                        // NEW FIELD: price
        remarks: Joi.string().allow('')
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
router.get('/', authorize(), controller.getLogs);                                   // GET all stock logs
router.get('/:id', authorize(), controller.getById);                                // GET single stock log
router.post('/', authorize(Role.Admin), addStockSchema, controller.addStock);      // CREATE stock
router.put('/:id', authorize(Role.Admin), updateStockSchema, controller.updateStock); // UPDATE stock
router.delete('/:id', authorize(Role.Admin), controller._delete);                   // DELETE stock

module.exports = router;
