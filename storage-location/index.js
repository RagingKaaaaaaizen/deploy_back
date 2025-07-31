const express = require('express');
const router = express.Router();
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const validateRequest = require('../_middleware/validate-request');
const Joi = require('joi');
const controller = require('./storage-location.controller');

// Validation schema
function schema(req, res, next) {
    const validation = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().allow('')
    });
    validateRequest(req, next, validation);
}

// Routes
router.get('/', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), controller.getAll);
router.get('/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), controller.getById);
router.post('/', authorize([Role.SuperAdmin, Role.Admin]), schema, controller.create);
router.put('/:id', authorize([Role.SuperAdmin, Role.Admin]), schema, controller.update);
router.delete('/:id', authorize([Role.SuperAdmin, Role.Admin]), controller._delete);

module.exports = router;
