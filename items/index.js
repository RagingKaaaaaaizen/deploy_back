const express = require('express');
const router = express.Router();
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const validateRequest = require('../_middleware/validate-request');
const Joi = require('joi');
const itemController = require('./item.controller');

// Validation schemas
function createSchema(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().required(),
        categoryId: Joi.number().required(),
        brandId: Joi.number().required(),
        description: Joi.string().allow('')
    });
    validateRequest(req, next, schema);
}

function updateSchema(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().empty(''),
        categoryId: Joi.number().optional(),
        brandId: Joi.number().optional(),
        description: Joi.string().allow('')
    });
    validateRequest(req, next, schema);
}

// Routes
router.get('/', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), itemController.getAll);
router.get('/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), itemController.getById);
router.post('/', authorize([Role.SuperAdmin, Role.Admin]), createSchema, itemController.create);
router.put('/:id', authorize([Role.SuperAdmin, Role.Admin]), updateSchema, itemController.update);
router.delete('/:id', authorize([Role.SuperAdmin, Role.Admin]), itemController._delete);

module.exports = router;
