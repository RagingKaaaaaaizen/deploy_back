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
        location: Joi.string().required(),                      // NEW FIELD
        remarks: Joi.string().allow('')
    });
    validateRequest(req, next, schema);
}

// Validation schema for updating stock
function updateStockSchema(req, res, next) {
    const schema = Joi.object({
        quantity: Joi.number().required(),
        location: Joi.string().required(),                      // allow updating location too
        remarks: Joi.string().allow('')
    });
    validateRequest(req, next, schema);
}

// Routes
router.get('/', authorize(), controller.getLogs);                      // GET logs
router.post('/', authorize(Role.Admin), addStockSchema, controller.addStock); // CREATE
router.put('/:id', authorize(Role.Admin), updateStockSchema, controller.updateStock); // UPDATE
router.delete('/:id', authorize(Role.Admin), controller._delete);      // DELETE

module.exports = router;
