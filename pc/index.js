const express = require('express');
const router = express.Router();
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const validateRequest = require('../_middleware/validate-request');
const Joi = require('joi');
const pcService = require('./pc.service');

// Routes
router.get('/', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), getAll);
router.get('/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), getById);
router.post('/', authorize([Role.SuperAdmin, Role.Admin]), createSchema, create);
router.put('/:id', authorize([Role.SuperAdmin, Role.Admin]), updateSchema, update);
router.delete('/:id', authorize([Role.SuperAdmin, Role.Admin]), deletePC);
router.get('/specifications/:categoryId', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), getSpecificationFields);

module.exports = router;

// Validation schemas
function createSchema(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().required(),
        serialNumber: Joi.string().allow(''),
        itemId: Joi.number().required(),
        roomLocationId: Joi.number().required(),
        specifications: Joi.string().allow(''),
        status: Joi.string().valid('Active', 'Inactive', 'Maintenance', 'Retired').default('Active'),
        assignedTo: Joi.string().allow(''),
        notes: Joi.string().allow('')
    });
    validateRequest(req, next, schema);
}

function updateSchema(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().empty(''),
        serialNumber: Joi.string().allow(''),
        itemId: Joi.number().empty(''),
        roomLocationId: Joi.number().empty(''),
        specifications: Joi.string().allow(''),
        status: Joi.string().valid('Active', 'Inactive', 'Maintenance', 'Retired').empty(''),
        assignedTo: Joi.string().allow(''),
        notes: Joi.string().allow('')
    });
    validateRequest(req, next, schema);
}

// Controller functions
function getAll(req, res, next) {
    pcService.getAll()
        .then(pcs => res.json(pcs))
        .catch(next);
}

function getById(req, res, next) {
    pcService.getById(req.params.id)
        .then(pc => pc ? res.json(pc) : res.sendStatus(404))
        .catch(next);
}

function create(req, res, next) {
    pcService.create(req.body, req.user.id)
        .then(pc => res.json(pc))
        .catch(next);
}

function update(req, res, next) {
    pcService.update(req.params.id, req.body)
        .then(pc => res.json(pc))
        .catch(next);
}

function deletePC(req, res, next) {
    pcService.delete(req.params.id)
        .then(() => res.json({ message: 'PC deleted successfully' }))
        .catch(next);
}

function getSpecificationFields(req, res, next) {
    pcService.getSpecificationFields(req.params.categoryId)
        .then(fields => res.json(fields))
        .catch(next);
} 