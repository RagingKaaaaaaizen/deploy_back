const express = require('express');
const router = express.Router();
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const validateRequest = require('../_middleware/validate-request');
const Joi = require('joi');
const controller = require('./category.controller');
// Routes
router.get('/', authorize(), controller.getAll);
router.get('/:id', authorize(), controller.getById);
router.post('/', authorize(Role.Admin), createSchema, controller.create);
router.put('/:id', authorize(Role.Admin), updateSchema, controller.update);
router.delete('/:id', authorize(Role.Admin), controller._delete);
// Validation schemas
function createSchema(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().allow('')
    });
    validateRequest(req, next, schema);
}

function updateSchema(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().empty(''),
        description: Joi.string().allow('')
    });
    validateRequest(req, next, schema);
}

module.exports = router;
