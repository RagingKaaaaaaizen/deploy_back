const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('../_middleware/validate-request');
const authorize = require('../_middleware/authorize')
const Role = require('../_helpers/role');
const itemCategoryService = require('./item-category.service');

// routes
router.get('/', authorize(), getAll);
router.get('/:id', authorize(), getById);
router.post('/', authorize(Role.Admin), createSchema, create);
router.put('/:id', authorize(Role.Admin), updateSchema, update);
router.delete('/:id', authorize(Role.Admin), _delete);

module.exports = router;

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

function getAll(req, res, next) {
    itemCategoryService.getAll()
        .then(itemCategories => res.json(itemCategories))
        .catch(next);
}

function getById(req, res, next) {
    itemCategoryService.getById(req.params.id)
        .then(itemCategory => res.json(itemCategory))
        .catch(next);
}

function create(req, res, next) {
    itemCategoryService.create(req.body)
        .then(itemCategory => res.json(itemCategory))
        .catch(next);
}

function update(req, res, next) {
    itemCategoryService.update(req.params.id, req.body)
        .then(itemCategory => res.json(itemCategory))
        .catch(next);
}

function _delete(req, res, next) {
    itemCategoryService._delete(req.params.id)
        .then(() => res.json({ message: 'Item category deleted successfully' }))
        .catch(next);
}
