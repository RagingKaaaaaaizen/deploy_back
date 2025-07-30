const express = require('express');
const router = express.Router();
const db = require('../_helpers/db'); // You'll need to access your models here
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const Joi = require('joi'); // For validation
const validateRequest = require('../_middleware/validate-request'); // For validation
const itemCategoryService = require('./item-category.service'); // Import service functions
const itemService = require('./item.service'); // Import service functions

// Item Category Routes
router.get('/item-categories', authorize(), getAllItemCategories);
router.get('/item-categories/:id', authorize(), getItemCategoryById);
router.post('/item-categories', authorize(Role.Admin), createItemCategorySchema, createItemCategory);
router.put('/item-categories/:id', authorize(Role.Admin), updateItemCategorySchema, updateItemCategory);
router.delete('/item-categories/:id', authorize(Role.Admin), deleteItemCategory);

// Item Routes
router.get('/items', authorize(), getAllItems);
router.get('/items/:id', authorize(), getItemById);
router.post('/items', authorize(Role.Admin), createItemSchema, createItem);
router.put('/items/:id', authorize(Role.Admin), updateItemSchema, updateItem);
router.delete('/items/:id', authorize(Role.Admin), deleteItem);

module.exports = router;

// Item Category Schema and Controller Functions (similar to employee functions)
function createItemCategorySchema(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().allow('')
    });
    validateRequest(req, next, schema);
}

function updateItemCategorySchema(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().empty(''),
        description: Joi.string().allow('')
    });
    validateRequest(req, next, schema);
}

async function getAllItemCategories(req, res, next) {
    try {
        const itemCategories = await itemCategoryService.getAll();
        res.json(itemCategories);
    } catch (err) {
        next(err);
    }
}

async function getItemCategoryById(req, res, next) {
    try {
        const itemCategory = await itemCategoryService.getById(req.params.id);
        if (!itemCategory) throw new Error('Item category not found');
        res.json(itemCategory);
    } catch (err) {
        next(err);
    }
}

async function createItemCategory(req, res, next) {
    try {
        const itemCategory = await itemCategoryService.create(req.body);
        res.status(201).json(itemCategory);
    } catch (err) {
        next(err);
    }
}

async function updateItemCategory(req, res, next) {
    try {
        const itemCategory = await itemCategoryService.update(req.params.id, req.body);
        res.json(itemCategory);
    } catch (err) {
        next(err);
    }
}

async function deleteItemCategory(req, res, next) {
    try {
        await itemCategoryService._delete(req.params.id);
        res.json({ message: 'Item category deleted successfully' });
    } catch (err) {
        next(err);
    }
}

// Item Schema and Controller Functions (similar to employee functions)
function createItemSchema(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().allow(''),
        quantity: Joi.number().integer().min(0).required(),
        categoryId: Joi.number().integer().required()
    });
    validateRequest(req, next, schema);
}

function updateItemSchema(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().empty(''),
        description: Joi.string().allow(''),
        quantity: Joi.number().integer().min(0).empty(''),
        categoryId: Joi.number().integer().empty('')
    });
    validateRequest(req, next, schema);
}

async function getAllItems(req, res, next) {
    try {
        const items = await itemService.getAll();
        res.json(items);
    } catch (err) {
        next(err);
    }
}

async function getItemById(req, res, next) {
    try {
        const item = await itemService.getById(req.params.id);
        if (!item) throw new Error('Item not found');
        res.json(item);
    } catch (err) {
        next(err);
    }
}

async function createItem(req, res, next) {
    try {
        const item = await itemService.create(req.body);
        res.status(201).json(item);
    } catch (err) {
        next(err);
    }
}

async function updateItem(req, res, next) {
    try {
        const item = await itemService.update(req.params.id, req.body);
        res.json(item);
    } catch (err) {
        next(err);
    }
}

async function deleteItem(req, res, next) {
    try {
        await itemService._delete(req.params.id);
        res.json({ message: 'Item deleted successfully' });
    } catch (err) {
        next(err);
    }
}
