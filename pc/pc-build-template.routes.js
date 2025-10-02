const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('../_middleware/validate-request');
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const pcBuildTemplateService = require('./pc-build-template.service');

// Routes
router.get('/', authorize([Role.SuperAdmin, Role.Admin, Role.Staff, Role.Viewer]), getAll);
router.get('/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Staff, Role.Viewer]), getById);
router.post('/', authorize([Role.SuperAdmin, Role.Admin]), createSchema, create);
router.put('/:id', authorize([Role.SuperAdmin, Role.Admin]), updateSchema, update);
router.delete('/:id', authorize([Role.SuperAdmin, Role.Admin]), _delete);
router.post('/:id/duplicate', authorize([Role.SuperAdmin, Role.Admin]), duplicateSchema, duplicate);
router.post('/compare/:pcId/:templateId', authorize([Role.SuperAdmin, Role.Admin, Role.Staff, Role.Viewer]), comparePC);
router.post('/compare-bulk', authorize([Role.SuperAdmin, Role.Admin, Role.Staff, Role.Viewer]), comparePCs);
router.post('/apply/:pcId/:templateId', authorize([Role.SuperAdmin, Role.Admin]), applyTemplateSchema, applyTemplate);
router.get('/:id/stats', authorize([Role.SuperAdmin, Role.Admin, Role.Staff, Role.Viewer]), getStats);

module.exports = router;

// Route handlers
function getAll(req, res, next) {
    pcBuildTemplateService.getAll()
        .then(templates => res.json(templates))
        .catch(next);
}

function getById(req, res, next) {
    pcBuildTemplateService.getById(req.params.id)
        .then(template => res.json(template))
        .catch(next);
}

function create(req, res, next) {
    pcBuildTemplateService.create(req.body, req.user.id)
        .then(template => res.json(template))
        .catch(next);
}

function update(req, res, next) {
    pcBuildTemplateService.update(req.params.id, req.body, req.user.id)
        .then(template => res.json(template))
        .catch(next);
}

function _delete(req, res, next) {
    pcBuildTemplateService.delete(req.params.id, req.user.id)
        .then(() => res.json({ message: 'Template deleted successfully' }))
        .catch(next);
}

function duplicate(req, res, next) {
    pcBuildTemplateService.duplicate(req.params.id, req.body.newName, req.user.id)
        .then(template => res.json(template))
        .catch(next);
}

function comparePC(req, res, next) {
    pcBuildTemplateService.comparePC(parseInt(req.params.pcId), parseInt(req.params.templateId))
        .then(comparison => res.json(comparison))
        .catch(next);
}

function comparePCs(req, res, next) {
    pcBuildTemplateService.comparePCs(req.body.pcIds, req.body.templateId)
        .then(comparisons => res.json(comparisons))
        .catch(next);
}

function applyTemplate(req, res, next) {
    pcBuildTemplateService.applyTemplateToPC(
        parseInt(req.params.pcId),
        parseInt(req.params.templateId),
        req.body.options,
        req.user.id
    )
        .then(result => res.json(result))
        .catch(next);
}

function getStats(req, res, next) {
    pcBuildTemplateService.getTemplateStats(req.params.id)
        .then(stats => res.json(stats))
        .catch(next);
}

// Validation schemas
function createSchema(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().min(3).max(255).required(),
        description: Joi.string().allow('').optional(),
        components: Joi.array().items(
            Joi.object({
                categoryId: Joi.number().integer().required(),
                itemId: Joi.number().integer().required(),
                quantity: Joi.number().integer().min(1).default(1),
                remarks: Joi.string().allow('').optional()
            })
        ).min(1).required()
    });
    validateRequest(req, next, schema);
}

function updateSchema(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().min(3).max(255).optional(),
        description: Joi.string().allow('').optional(),
        components: Joi.array().items(
            Joi.object({
                categoryId: Joi.number().integer().required(),
                itemId: Joi.number().integer().required(),
                quantity: Joi.number().integer().min(1).default(1),
                remarks: Joi.string().allow('').optional()
            })
        ).optional()
    });
    validateRequest(req, next, schema);
}

function duplicateSchema(req, res, next) {
    const schema = Joi.object({
        newName: Joi.string().min(3).max(255).required()
    });
    validateRequest(req, next, schema);
}

function applyTemplateSchema(req, res, next) {
    const schema = Joi.object({
        options: Joi.object({
            replaceAll: Joi.boolean().default(false),
            replaceCategories: Joi.array().items(Joi.number().integer()).default([])
        }).optional()
    });
    validateRequest(req, next, schema);
}



