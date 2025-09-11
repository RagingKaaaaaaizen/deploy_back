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
            console.log('=== STOCK CONTROLLER DEBUG ===');
            console.log('req.body received:', JSON.stringify(req.body, null, 2));
            console.log('req.body.itemId:', req.body.itemId, 'type:', typeof req.body.itemId);
            console.log('req.body.quantity:', req.body.quantity, 'type:', typeof req.body.quantity);
            console.log('req.body.price:', req.body.price, 'type:', typeof req.body.price);
            console.log('req.body.locationId:', req.body.locationId, 'type:', typeof req.body.locationId);
            
            const approvalRequestData = {
                type: 'stock',
                requestData: req.body,
                createdBy: req.user.id
            };

            console.log('Approval request data to save:', JSON.stringify(approvalRequestData, null, 2));

            const approvalRequest = await approvalRequestService.create(approvalRequestData);
            
            console.log('Created approval request:', JSON.stringify(approvalRequest, null, 2));
            
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

// DELETE stock by ID
exports.delete = (req, res, next) => {
    stockService.delete(req.params.id)
        .then(() => res.json({ message: 'Stock deleted successfully' }))
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
