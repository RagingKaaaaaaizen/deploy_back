const express = require('express');
const router = express.Router();
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const validateRequest = require('../_middleware/validate-request');
const upload = require('../_middleware/upload');
const Joi = require('joi');
const controller = require('./stock.controller');

// Validation schema for adding stock
function addStockSchema(req, res, next) {
    const schema = Joi.object({
        itemId: Joi.number().required(),
        quantity: Joi.number().required(),
        locationId: Joi.number().required(),                   // FOREIGN KEY to StorageLocation
        price: Joi.number().required(),                        // NEW FIELD: price
        remarks: Joi.string().allow(''),
        receiptAttachment: Joi.string().allow(''),             // Optional receipt file path
        disposeId: Joi.number().optional()                     // Optional link to disposal record
    });
    validateRequest(req, next, schema);
}

// Validation schema for updating stock
function updateStockSchema(req, res, next) {
    const schema = Joi.object({
        quantity: Joi.number().required(),
        locationId: Joi.number().required(),
        price: Joi.number().required(),                        // allow updating price
        remarks: Joi.string().allow('')
    });
    validateRequest(req, next, schema);
}

// Validation schema for bulk stock entries
function bulkStockSchema(req, res, next) {
    // Parse stockEntries if it's a JSON string (from FormData)
    if (req.body.stockEntries && typeof req.body.stockEntries === 'string') {
        try {
            req.body.stockEntries = JSON.parse(req.body.stockEntries);
        } catch (error) {
            return res.status(400).send({ message: 'Invalid stockEntries JSON format' });
        }
    }
    
    const schema = Joi.object({
        stockEntries: Joi.array().items(
            Joi.object({
                itemId: Joi.number().required(),
                quantity: Joi.number().required(),
                locationId: Joi.number().required(),
                price: Joi.number().required(),
                remarks: Joi.string().allow('')
            })
        ).min(1).required()
    });
    validateRequest(req, next, schema);
}

// Routes
router.get('/', authorize([Role.SuperAdmin, Role.Admin, Role.Staff, Role.Viewer]), controller.getLogs);                                   // GET all stock logs
router.get('/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Staff, Role.Viewer]), controller.getById);                                // GET single stock log
router.get('/available/:itemId', authorize([Role.SuperAdmin, Role.Admin, Role.Staff, Role.Viewer]), controller.getAvailableStock);        // GET available stock for item
router.get('/receipt/:filename', authorize([Role.SuperAdmin, Role.Admin, Role.Staff, Role.Viewer]), controller.getReceipt);               // GET receipt file
router.get('/receipts/list', authorize([Role.SuperAdmin, Role.Admin, Role.Staff, Role.Viewer]), controller.listReceipts);                 // GET list of receipt files
router.post('/', authorize([Role.SuperAdmin, Role.Admin, Role.Staff]), upload.single('receipt'), addStockSchema, controller.addStock);      // CREATE stock with file upload
router.post('/bulk', authorize([Role.SuperAdmin, Role.Admin, Role.Staff]), upload.single('receipt'), bulkStockSchema, controller.addBulkStock);  // CREATE multiple stock entries
router.put('/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Staff]), updateStockSchema, controller.updateStock); // UPDATE stock
router.delete('/:id', authorize([Role.SuperAdmin, Role.Admin]), controller.delete);                   // DELETE stock

module.exports = router;
