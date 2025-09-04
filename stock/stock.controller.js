const stockService = require('./stock.service');
const approvalRequestService = require('../approval-requests/approval-request.service');
const path = require('path');
const fs = require('fs');

// GET all stock logs
exports.getLogs = (req, res, next) => {
    stockService.getAll()
        .then(logs => res.send(logs))
        .catch(next);
};

// ADD stock
exports.addStock = async (req, res, next) => {
    try {
        // Ensure locationId is present in request body
        if (!req.body.locationId) {
            return res.status(400).send({ message: 'Location is required' });
        }

        // Ensure user is authenticated
        if (!req.user || !req.user.id) {
            return res.status(401).send({ message: 'User authentication required' });
        }

        // Handle file upload if present
        if (req.file) {
            req.body.receiptAttachment = req.file.filename;
        }

        // Check user role - Staff needs approval, Admin/SuperAdmin can bypass
        if (req.user.role === 'Staff') {
            // Create approval request for staff
            const approvalRequestData = {
                type: 'stock',
                requestData: req.body,
                createdBy: req.user.id
            };

            const approvalRequest = await approvalRequestService.create(approvalRequestData);
            
            return res.status(201).send({
                message: 'Stock entry submitted for approval',
                approvalRequestId: approvalRequest.id,
                status: 'pending_approval'
            });
        } else {
            // Admin and SuperAdmin can create stock directly
            const stock = await stockService.create(req.body, req.user.id);
            res.send(stock);
        }
    } catch (error) {
        next(error);
    }
};

// UPDATE stock
exports.updateStock = (req, res, next) => {
    stockService.update(req.params.id, req.body)
        .then(stock => res.send(stock))
        .catch(next);
};

// DELETE stock
exports._delete = (req, res, next) => {
    stockService.delete(req.params.id)
        .then(() => res.send({ message: 'Stock entry deleted successfully' }))
        .catch(next);
};

// GET stock by ID
exports.getById = (req, res, next) => {
    stockService.getById(req.params.id)
        .then(stock => stock ? res.send(stock) : res.sendStatus(404))
        .catch(next);
};

// GET available stock for an item
exports.getAvailableStock = (req, res, next) => {
    stockService.getAvailableStock(req.params.itemId)
        .then(stock => res.send(stock))
        .catch(next);
};

// GET receipt file
exports.getReceipt = (req, res, next) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads/receipts', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
        return res.status(404).send({ message: 'Receipt file not found' });
    }
    
    // Send file
    res.sendFile(filePath);
};
