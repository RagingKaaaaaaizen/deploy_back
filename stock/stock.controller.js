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

// CREATE multiple stock entries (bulk)
exports.addBulkStock = async (req, res, next) => {
    try {
        // Ensure user is authenticated
        if (!req.user || !req.user.id) {
            return res.status(401).send({ message: 'User authentication required' });
        }

        let { stockEntries } = req.body;
        
        // Parse stockEntries if it's a JSON string (from FormData)
        if (typeof stockEntries === 'string') {
            try {
                stockEntries = JSON.parse(stockEntries);
            } catch (error) {
                console.error('Error parsing stockEntries JSON:', error);
                return res.status(400).send({ message: 'Invalid stockEntries JSON format' });
            }
        }
        
        console.log('=== BULK STOCK DEBUG ===');
        console.log('Parsed stockEntries:', JSON.stringify(stockEntries, null, 2));
        console.log('StockEntries type:', typeof stockEntries);
        console.log('StockEntries is array:', Array.isArray(stockEntries));
        console.log('StockEntries length:', stockEntries?.length);
        
        if (!stockEntries || !Array.isArray(stockEntries) || stockEntries.length === 0) {
            console.log('Validation failed: stockEntries is invalid');
            return res.status(400).send({ message: 'Stock entries array is required' });
        }

        // Handle file upload if present
        let receiptAttachment = null;
        if (req.file) {
            receiptAttachment = req.file.filename;
        }

        // Check user role - Staff needs approval, Admin/SuperAdmin can bypass
        if (req.user.role === 'Staff') {
            // Create single approval request for all items
            const approvalRequestData = {
                type: 'stock',
                requestData: {
                    stockEntries: stockEntries,
                    receiptAttachment: receiptAttachment
                },
                createdBy: req.user.id
            };

            console.log('=== BULK STOCK CONTROLLER DEBUG ===');
            console.log('Creating bulk approval request for', stockEntries.length, 'items');
            console.log('Approval request data:', JSON.stringify(approvalRequestData, null, 2));

            const approvalRequest = await approvalRequestService.create(approvalRequestData);
            
            return res.status(201).send({
                message: `${stockEntries.length} stock item(s) submitted for approval`,
                approvalRequestId: approvalRequest.id,
                status: 'pending_approval'
            });
        } else {
            // Admin and SuperAdmin can create stock directly
            const results = [];
            for (const entry of stockEntries) {
                const stock = await stockService.create(entry, req.user.id);
                results.push(stock);
            }
            
            res.send({
                message: `${stockEntries.length} stock item(s) added successfully`,
                stocks: results
            });
        }
    } catch (error) {
        next(error);
    }
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
    
    console.log('=== RECEIPT FILE REQUEST ===');
    console.log('Requested filename:', filename);
    console.log('File path:', filePath);
    console.log('File exists:', fs.existsSync(filePath));
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
        console.log('File not found, returning 404');
        return res.status(404).send({ message: 'Receipt file not found' });
    }
    
    console.log('File found, sending file');
    // Send file
    res.sendFile(filePath);
};

// GET list of receipt files (for debugging)
exports.listReceipts = (req, res, next) => {
    const receiptsDir = path.join(__dirname, '../uploads/receipts');
    
    try {
        const files = fs.readdirSync(receiptsDir);
        console.log('=== RECEIPT FILES LIST ===');
        console.log('Files in receipts directory:', files);
        
        res.json({
            success: true,
            files: files,
            count: files.length
        });
    } catch (error) {
        console.error('Error reading receipts directory:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// GET check for orphaned receipt references
exports.checkOrphanedReceipts = async (req, res, next) => {
    try {
        const receiptsDir = path.join(__dirname, '../uploads/receipts');
        const existingFiles = fs.existsSync(receiptsDir) ? fs.readdirSync(receiptsDir) : [];
        
        // Get all stocks with receipt attachments
        const stocksWithReceipts = await db.Stock.findAll({
            where: {
                receiptAttachment: {
                    [db.Sequelize.Op.ne]: null
                }
            },
            attributes: ['id', 'receiptAttachment']
        });
        
        const orphanedReceipts = [];
        const validReceipts = [];
        
        stocksWithReceipts.forEach(stock => {
            if (existingFiles.includes(stock.receiptAttachment)) {
                validReceipts.push(stock);
            } else {
                orphanedReceipts.push(stock);
            }
        });
        
        console.log('=== ORPHANED RECEIPTS CHECK ===');
        console.log('Total stocks with receipts:', stocksWithReceipts.length);
        console.log('Valid receipts:', validReceipts.length);
        console.log('Orphaned receipts:', orphanedReceipts.length);
        
        res.json({
            success: true,
            totalStocksWithReceipts: stocksWithReceipts.length,
            validReceipts: validReceipts.length,
            orphanedReceipts: orphanedReceipts.length,
            orphanedList: orphanedReceipts.map(s => ({
                id: s.id,
                receiptAttachment: s.receiptAttachment
            }))
        });
    } catch (error) {
        console.error('Error checking orphaned receipts:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
