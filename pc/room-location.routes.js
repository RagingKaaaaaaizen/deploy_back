const express = require('express');
const router = express.Router();
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const validateRequest = require('../_middleware/validate-request');
const Joi = require('joi');
const controller = require('./room-location.controller');

// Validation schema for creating room location
function createRoomLocationSchema(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().allow(''),
        building: Joi.string().allow(''),
        floor: Joi.string().allow(''),
        roomNumber: Joi.string().allow(''),
        capacity: Joi.number().integer().min(0).optional(),
        status: Joi.string().valid('Active', 'Inactive', 'Maintenance').default('Active')
    });
    validateRequest(req, next, schema);
}

// Validation schema for updating room location
function updateRoomLocationSchema(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().allow(''),
        building: Joi.string().allow(''),
        floor: Joi.string().allow(''),
        roomNumber: Joi.string().allow(''),
        capacity: Joi.number().integer().min(0).optional(),
        status: Joi.string().valid('Active', 'Inactive', 'Maintenance')
    });
    validateRequest(req, next, schema);
}

// Routes
router.get('/', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), controller.getAll);
router.get('/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), controller.getById);
router.post('/', authorize([Role.SuperAdmin, Role.Admin]), createRoomLocationSchema, controller.create);
router.put('/:id', authorize([Role.SuperAdmin, Role.Admin]), updateRoomLocationSchema, controller.update);
router.delete('/:id', authorize([Role.SuperAdmin, Role.Admin]), controller.delete);

module.exports = router; 