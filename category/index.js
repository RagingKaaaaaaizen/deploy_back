const express = require('express');
const router = express.Router();
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const validateRequest = require('../_middleware/validate-request');
const Joi = require('joi');
const controller = require('./category.controller');

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

// Routes
router.get('/', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), controller.getAll);
router.get('/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), controller.getById);
router.post('/', authorize([Role.SuperAdmin, Role.Admin]), createSchema, controller.create);
router.put('/:id', authorize([Role.SuperAdmin, Role.Admin]), updateSchema, controller.update);
router.delete('/:id', authorize([Role.SuperAdmin, Role.Admin]), controller._delete);

module.exports = router;
