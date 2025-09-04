const express = require('express');
const router = express.Router();
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const validateRequest = require('../_middleware/validate-request');
const Joi = require('joi');
const specificationService = require('./specification.service');

// Routes
router.get('/', authorize([Role.SuperAdmin, Role.Admin, Role.Staff, Role.Viewer]), getAll);
router.get('/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Staff, Role.Viewer]), getById);
router.post('/', authorize([Role.SuperAdmin, Role.Admin]), createSchema, create);
router.put('/:id', authorize([Role.SuperAdmin, Role.Admin]), updateSchema, update);
router.delete('/:id', authorize([Role.SuperAdmin, Role.Admin]), deleteField);
router.get('/category/:categoryId', authorize([Role.SuperAdmin, Role.Admin, Role.Staff, Role.Viewer]), getFieldsByCategory);
router.delete('/category/:categoryId', authorize([Role.SuperAdmin, Role.Admin]), deleteFieldsByCategory);

module.exports = router;

// Validation schemas
function createSchema(req, res, next) {
    const schema = Joi.object({
        categoryId: Joi.number().required(),
        fieldName: Joi.string().required(),
        fieldLabel: Joi.string().required(),
        fieldType: Joi.string().valid('text', 'textarea', 'number', 'select', 'date').required(),
        isRequired: Joi.boolean().default(false),
        fieldOrder: Joi.number().default(0),
        options: Joi.string().allow('')
    });
    validateRequest(req, next, schema);
}

function updateSchema(req, res, next) {
    const schema = Joi.object({
        categoryId: Joi.number().empty(''),
        fieldName: Joi.string().empty(''),
        fieldLabel: Joi.string().empty(''),
        fieldType: Joi.string().valid('text', 'textarea', 'number', 'select', 'date').empty(''),
        isRequired: Joi.boolean().empty(''),
        fieldOrder: Joi.number().empty(''),
        options: Joi.string().allow('')
    });
    validateRequest(req, next, schema);
}

// Controller functions
function getAll(req, res, next) {
    specificationService.getAllFields()
        .then(fields => res.json(fields))
        .catch(next);
}

function getById(req, res, next) {
    specificationService.getFieldById(req.params.id)
        .then(field => field ? res.json(field) : res.sendStatus(404))
        .catch(next);
}

function create(req, res, next) {
    specificationService.createField(req.body)
        .then(field => res.json(field))
        .catch(next);
}

function update(req, res, next) {
    specificationService.updateField(req.params.id, req.body)
        .then(field => res.json(field))
        .catch(next);
}

function deleteField(req, res, next) {
    specificationService.deleteField(req.params.id)
        .then(() => res.json({ message: 'Specification field deleted successfully' }))
        .catch(next);
}

function getFieldsByCategory(req, res, next) {
    specificationService.getFieldsByCategory(req.params.categoryId)
        .then(fields => res.json(fields))
        .catch(next);
}

function deleteFieldsByCategory(req, res, next) {
    specificationService.deleteFieldsByCategory(req.params.categoryId)
        .then(() => res.json({ message: 'All specification fields for category deleted successfully' }))
        .catch(next);
} 