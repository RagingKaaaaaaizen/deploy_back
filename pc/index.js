const express = require('express');
const router = express.Router();
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const validateRequest = require('../_middleware/validate-request');
const Joi = require('joi');
const pcService = require('./pc.service');

// Routes
router.get('/', authorize([Role.SuperAdmin, Role.Admin, Role.Staff, Role.Viewer]), getAll);
router.get('/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Staff, Role.Viewer]), getById);
router.post('/', authorize([Role.SuperAdmin, Role.Admin, Role.Staff]), createSchema, create);
router.put('/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Staff]), updateSchema, update);
router.delete('/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Staff]), deletePC);
router.get('/specifications/:categoryId', authorize([Role.SuperAdmin, Role.Admin, Role.Staff, Role.Viewer]), getSpecificationFields);

module.exports = router;

// Validation schemas
function createSchema(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().required(),
        serialNumber: Joi.string().allow(''),
        roomLocationId: Joi.number().required(),
        status: Joi.string().valid('Active', 'Inactive', 'Maintenance', 'Retired').default('Active'),
        assignedTo: Joi.string().allow(''),
        notes: Joi.string().allow('')
    });
    validateRequest(req, next, schema);
}

function updateSchema(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().empty('').optional(),
        serialNumber: Joi.string().allow('', null).optional(),
        roomLocationId: Joi.number().empty('').optional(),
        status: Joi.string().valid('Active', 'Inactive', 'Maintenance', 'Retired').empty('').optional(),
        assignedTo: Joi.string().allow('', null).optional(),
        notes: Joi.string().allow('', null).optional()
    });
    validateRequest(req, next, schema);
}

// Controller functions
function getAll(req, res, next) {
    try {
        console.log('🔍 PC Controller - getAll called');
        console.log('🔍 PC Controller - User:', req.user);
        
        pcService.getAll()
            .then(pcs => {
                console.log('✅ PC Controller - getAll successful, sending', pcs.length, 'PCs');
                res.json(pcs);
            })
            .catch(error => {
                console.error('❌ PC Controller - Error in getAll:', error);
                console.error('❌ PC Controller - Error message:', error.message);
                console.error('❌ PC Controller - Error stack:', error.stack);
                next(error);
            });
    } catch (error) {
        console.error('❌ PC Controller - Unexpected error in getAll function:', error);
        console.error('❌ PC Controller - Error stack:', error.stack);
        next(error);
    }
}

function getById(req, res, next) {
    pcService.getById(req.params.id)
        .then(pc => pc ? res.json(pc) : res.sendStatus(404))
        .catch(next);
}

function create(req, res, next) {
    try {
        console.log('🔍 PC Controller - create called');
        console.log('🔍 PC Controller - Request body:', req.body);
        console.log('🔍 PC Controller - User ID:', req.user.id);
        console.log('🔍 PC Controller - User object:', req.user);
        
        pcService.create(req.body, req.user.id)
            .then(pc => {
                console.log('✅ PC Controller - PC created successfully:', pc);
                res.json(pc);
            })
            .catch(error => {
                console.error('❌ PC Controller - Error creating PC:', error);
                console.error('❌ PC Controller - Error message:', error.message);
                console.error('❌ PC Controller - Error stack:', error.stack);
                next(error);
            });
    } catch (error) {
        console.error('❌ PC Controller - Unexpected error in create function:', error);
        console.error('❌ PC Controller - Error stack:', error.stack);
        next(error);
    }
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