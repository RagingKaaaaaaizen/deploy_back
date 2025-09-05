const db = require('../_helpers/db');
const approvalRequestService = require('./approval-request.service');
const stockService = require('../stock/stock.service');
const disposeService = require('../dispose/dispose.service');

// Simple test endpoint without authentication
exports.test = async (req, res) => {
    try {
        console.log('Test endpoint called');
        
        // Test database connection
        await db.sequelize.authenticate();
        console.log('✅ Database connection successful');
        
        // Test models
        const models = Object.keys(db);
        console.log('Available models:', models);
        
        // Test Stock model
        const stockModelAvailable = !!db.Stock;
        console.log('Stock model available:', stockModelAvailable);
        
        // Test ApprovalRequest model
        const approvalModelAvailable = !!db.ApprovalRequest;
        console.log('ApprovalRequest model available:', approvalModelAvailable);
        
        // Test if we can query approval requests
        let pendingCount = 0;
        if (approvalModelAvailable) {
            try {
                const pendingRequests = await db.ApprovalRequest.findAll({
                    where: { status: 'pending' }
                });
                pendingCount = pendingRequests.length;
                console.log('Found', pendingCount, 'pending approval requests');
            } catch (queryError) {
                console.error('Error querying approval requests:', queryError);
            }
        }
        
        res.json({ 
            message: 'Approval requests test endpoint is working!',
            timestamp: new Date(),
            environment: process.env.NODE_ENV || 'development',
            database: 'connected',
            models: models,
            stockModel: stockModelAvailable,
            approvalModel: approvalModelAvailable,
            pendingRequests: pendingCount
        });
    } catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({ 
            message: 'Test endpoint failed',
            error: error.message,
            stack: error.stack
        });
    }
};

// Test endpoint to check stock service
exports.testStockService = async (req, res) => {
    try {
        console.log('Testing stock service...');
        console.log('Stock service methods:', Object.keys(stockService));
        
        // Test if we can call the service
        const testResult = await stockService.getAll();
        console.log('Stock service test successful, found', testResult.length, 'stocks');
        
        res.json({
            message: 'Stock service is working!',
            methods: Object.keys(stockService),
            stockCount: testResult.length,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Stock service test failed:', error);
        res.status(500).json({
            message: 'Stock service test failed!',
            error: error.message,
            stack: error.stack,
            timestamp: new Date()
        });
    }
};

// Test endpoint to check database connection
exports.testDatabase = async (req, res) => {
    try {
        console.log('Testing database connection...');
        
        // Test database connection
        await db.sequelize.authenticate();
        console.log('Database connection successful');
        
        // Test approval request model
        const approvalCount = await db.ApprovalRequest.count();
        console.log('Found', approvalCount, 'approval requests');
        
        // Test stock model
        const stockCount = await db.Stock.count();
        console.log('Found', stockCount, 'stock entries');
        
        res.json({
            message: 'Database is working!',
            approvalRequests: approvalCount,
            stockEntries: stockCount,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Database test failed:', error);
        res.status(500).json({
            message: 'Database test failed!',
            error: error.message,
            stack: error.stack,
            timestamp: new Date()
        });
    }
};

// Test endpoint to simulate approval process
// Test data flow endpoint - shows how data flows from approval to stock creation
exports.testDataFlow = async (req, res) => {
    try {
        console.log('Testing data flow from approval to stock creation...');
        
        // Test database connection
        await db.sequelize.authenticate();
        console.log('✅ Database connection successful');
        
        // Get the first pending stock approval request
        const pendingStockRequest = await db.ApprovalRequest.findOne({
            where: { 
                status: 'pending',
                type: 'stock'
            }
        });
        
        if (!pendingStockRequest) {
            return res.json({
                message: 'No pending stock approval requests found',
                timestamp: new Date()
            });
        }
        
        console.log('Found pending stock request:', pendingStockRequest.id);
        console.log('Request data:', JSON.stringify(pendingStockRequest.requestData, null, 2));
        
        // Simulate the data transformation that happens during approval
        const requestData = pendingStockRequest.requestData;
        const stockData = {
            itemId: parseInt(requestData.itemId),
            locationId: parseInt(requestData.locationId),
            quantity: parseInt(requestData.quantity),
            price: parseFloat(requestData.price),
            totalPrice: parseInt(requestData.quantity) * parseFloat(requestData.price),
            remarks: requestData.remarks || '',
            receiptAttachment: requestData.receiptAttachment || null,
            disposeId: requestData.disposeId ? parseInt(requestData.disposeId) : null,
            createdBy: pendingStockRequest.createdBy
        };
        
        console.log('Transformed stock data:', JSON.stringify(stockData, null, 2));
        
        // Test if we can create the stock entry (without actually creating it)
        console.log('Testing stock creation validation...');
        
        // Validate required fields
        const validationErrors = [];
        if (!stockData.itemId) validationErrors.push('itemId is missing');
        if (!stockData.locationId) validationErrors.push('locationId is missing');
        if (!stockData.quantity) validationErrors.push('quantity is missing');
        if (!stockData.price) validationErrors.push('price is missing');
        if (!stockData.createdBy) validationErrors.push('createdBy is missing');
        
        if (validationErrors.length > 0) {
            return res.json({
                message: 'Data validation failed',
                errors: validationErrors,
                requestData: requestData,
                stockData: stockData,
                timestamp: new Date()
            });
        }
        
        res.json({
            message: 'Data flow test successful!',
            approvalRequestId: pendingStockRequest.id,
            originalRequestData: requestData,
            transformedStockData: stockData,
            validationPassed: true,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('❌ Data flow test failed:', error);
        res.status(500).json({
            message: 'Data flow test failed',
            error: error.message,
            stack: error.stack,
            timestamp: new Date()
        });
    }
};

// Test stock creation endpoint
exports.testStockCreation = async (req, res) => {
    try {
        console.log('Testing stock creation...');
        
        // Test database connection
        await db.sequelize.authenticate();
        console.log('✅ Database connection successful');
        
        // Test Stock model
        if (!db.Stock) {
            throw new Error('Stock model is not available');
        }
        console.log('✅ Stock model is available');
        
        // Test creating a simple stock entry
        const testStockData = {
            itemId: 1,
            locationId: 1,
            quantity: 1,
            price: 10.00,
            totalPrice: 10.00,
            remarks: 'Test stock entry',
            receiptAttachment: null,
            disposeId: null,
            createdBy: 1
        };
        
        console.log('Creating test stock with data:', testStockData);
        const testStock = await db.Stock.create(testStockData);
        console.log('✅ Test stock created successfully with ID:', testStock.id);
        
        // Clean up test stock
        await db.Stock.destroy({ where: { id: testStock.id } });
        console.log('✅ Test stock cleaned up');
        
        res.json({
            message: 'Stock creation test successful!',
            testStockId: testStock.id,
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('❌ Stock creation test failed:', error);
        res.status(500).json({
            message: 'Stock creation test failed',
            error: error.message,
            stack: error.stack,
            timestamp: new Date()
        });
    }
};

exports.testApprovalProcess = async (req, res) => {
    try {
        console.log('Testing approval process...');
        
        // Test database connection
        await db.sequelize.authenticate();
        console.log('✅ Database connection successful');
        
        // Test models
        console.log('Available models:', Object.keys(db));
        console.log('Stock model available:', !!db.Stock);
        console.log('ApprovalRequest model available:', !!db.ApprovalRequest);
        console.log('Dispose model available:', !!db.Dispose);
        
        // Test Stock model methods
        if (db.Stock) {
            console.log('Stock model methods:', Object.getOwnPropertyNames(db.Stock));
            console.log('Stock.create method:', typeof db.Stock.create);
        }
        
        // Get the first pending approval request
        const pendingRequest = await db.ApprovalRequest.findOne({
            where: { status: 'pending' }
        });
        
        if (!pendingRequest) {
            return res.json({
                message: 'No pending approval requests found',
                models: Object.keys(db),
                stockModel: !!db.Stock,
                approvalModel: !!db.ApprovalRequest,
                disposeModel: !!db.Dispose,
                timestamp: new Date()
            });
        }
        
        console.log('Found pending request:', pendingRequest.id);
        console.log('Request data:', JSON.stringify(pendingRequest.requestData, null, 2));
        
        res.json({
            message: 'Approval process test successful',
            pendingRequestId: pendingRequest.id,
            requestData: pendingRequest.requestData,
            models: Object.keys(db),
            stockModel: !!db.Stock,
            approvalModel: !!db.ApprovalRequest,
            disposeModel: !!db.Dispose,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Approval process test failed:', error);
        res.status(500).json({
            message: 'Approval process test failed!',
            error: error.message,
            stack: error.stack,
            timestamp: new Date()
        });
    }
};

// GET /api/approval-requests - Get all approval requests (SuperAdmin/Admin only)
exports.getAll = async (req, res, next) => {
    try {
        const approvalRequests = await approvalRequestService.getAll();
        res.json(approvalRequests);
    } catch (error) {
        next(error);
    }
};

// GET /api/approval-requests/my - Get current user's approval requests (Staff)
exports.getMyRequests = async (req, res, next) => {
    try {
        const approvalRequests = await approvalRequestService.getByCreator(req.user.id);
        res.json(approvalRequests);
    } catch (error) {
        next(error);
    }
};

// GET /api/approval-requests/:id - Get approval request by ID
exports.getById = async (req, res, next) => {
    try {
        const approvalRequest = await approvalRequestService.getById(req.params.id);
        if (!approvalRequest) {
            return res.status(404).json({ message: 'Approval request not found' });
        }
        res.json(approvalRequest);
    } catch (error) {
        next(error);
    }
};

// POST /api/approval-requests - Create new approval request
exports.create = async (req, res, next) => {
    try {
        const requestData = {
            type: req.body.type,
            requestData: req.body.requestData,
            createdBy: req.user.id
        };

        const approvalRequest = await approvalRequestService.create(requestData);
        res.status(201).json(approvalRequest);
    } catch (error) {
        next(error);
    }
};

// PUT /api/approval-requests/:id/approve - Approve request
exports.approve = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { remarks } = req.body;

        console.log('=== APPROVE REQUEST DEBUG ===');
        console.log('Request ID:', id);
        console.log('User ID:', req.user ? req.user.id : 'NO USER');
        console.log('User Role:', req.user ? req.user.role : 'NO ROLE');
        console.log('Remarks:', remarks);
        console.log('Request Body:', JSON.stringify(req.body, null, 2));
        console.log('Request Params:', JSON.stringify(req.params, null, 2));
        console.log('Request Headers:', JSON.stringify(req.headers, null, 2));

        // Check database connection first
        try {
            await db.sequelize.authenticate();
            console.log('✅ Database connection verified');
        } catch (dbConnectionError) {
            console.error('❌ Database connection failed:', dbConnectionError);
            return res.status(500).json({ message: 'Database connection failed' });
        }

        // Get the approval request with simpler query to avoid relationship issues
        let approvalRequest;
        try {
            console.log('Attempting to find approval request with ID:', id);
            approvalRequest = await db.ApprovalRequest.findByPk(id);
            console.log('Approval Request Found:', approvalRequest ? 'Yes' : 'No');
            if (approvalRequest) {
                console.log('Approval Request Data:', JSON.stringify(approvalRequest.dataValues, null, 2));
                console.log('Request Data Type:', typeof approvalRequest.requestData);
                console.log('Request Data Keys:', Object.keys(approvalRequest.requestData || {}));
                console.log('Created By Type:', typeof approvalRequest.createdBy);
                console.log('Created By Value:', approvalRequest.createdBy);
            }
        } catch (dbError) {
            console.error('❌ Database error getting approval request:', dbError);
            console.error('Database error details:', {
                message: dbError.message,
                stack: dbError.stack,
                name: dbError.name
            });
            return res.status(500).json({ 
                message: 'Database error retrieving approval request',
                error: dbError.message 
            });
        }
        
        if (!approvalRequest) {
            console.log('❌ Approval request not found for ID:', id);
            return res.status(404).json({ message: 'Approval request not found' });
        }

        console.log('Current Status:', approvalRequest.status);
        console.log('Request Type:', approvalRequest.type);
        console.log('Request Data:', JSON.stringify(approvalRequest.requestData, null, 2));
        console.log('Created By:', approvalRequest.createdBy);

        if (approvalRequest.status !== 'pending') {
            console.log('❌ Request is not pending, current status:', approvalRequest.status);
            return res.status(400).json({ message: 'Request is not pending' });
        }

        // Execute the actual request based on type FIRST, then update status
        console.log('Executing request of type:', approvalRequest.type);
        
        // Test database connection and models before proceeding
        console.log('=== DATABASE CONNECTION TEST ===');
        try {
            await db.sequelize.authenticate();
            console.log('✅ Database connection successful');
        } catch (dbError) {
            console.error('❌ Database connection failed:', dbError);
            throw new Error(`Database connection failed: ${dbError.message}`);
        }
        
        console.log('Available models:', Object.keys(db));
        console.log('Stock model available:', !!db.Stock);
        console.log('ApprovalRequest model available:', !!db.ApprovalRequest);
        
        if (approvalRequest.type === 'stock') {
            console.log('Executing stock request with data:', approvalRequest.requestData);
            console.log('Created by user ID:', approvalRequest.createdBy);
            
            try {
                // Simplified stock creation - bypass complex logic
                console.log('=== SIMPLIFIED STOCK CREATION ===');
                const requestData = approvalRequest.requestData;
                console.log('Raw request data:', JSON.stringify(requestData, null, 2));
                console.log('Request data type:', typeof requestData);
                console.log('Request data is array:', Array.isArray(requestData));
                
                // Validate required fields before processing
                if (!requestData) {
                    throw new Error('Request data is null or undefined');
                }
                
                if (!requestData.itemId) {
                    throw new Error('itemId is missing from request data');
                }
                if (!requestData.locationId) {
                    throw new Error('locationId is missing from request data');
                }
                if (!requestData.quantity) {
                    throw new Error('quantity is missing from request data');
                }
                if (!requestData.price) {
                    throw new Error('price is missing from request data');
                }
                
                console.log('All required fields present, proceeding with stock creation...');
                
                // Create stock entry directly
                const stockData = {
                    itemId: parseInt(requestData.itemId),
                    locationId: parseInt(requestData.locationId),
                    quantity: parseInt(requestData.quantity),
                    price: parseFloat(requestData.price),
                    totalPrice: parseInt(requestData.quantity) * parseFloat(requestData.price),
                    remarks: requestData.remarks || '',
                    receiptAttachment: requestData.receiptAttachment || null,
                    disposeId: requestData.disposeId ? parseInt(requestData.disposeId) : null,
                    createdBy: approvalRequest.createdBy
                };
                
                console.log('Stock data to create:', JSON.stringify(stockData, null, 2));
                console.log('About to call db.Stock.create...');
                
                // Check if Stock model is available
                if (!db.Stock) {
                    throw new Error('Stock model is not available in db object');
                }
                console.log('Stock model is available');
                
                // Check if Stock.create method exists
                if (typeof db.Stock.create !== 'function') {
                    throw new Error('Stock.create method is not available');
                }
                console.log('Stock.create method is available');
                
                // Try to create stock with detailed error handling
                let newStock;
                try {
                    console.log('Attempting to create stock with data:', stockData);
                    newStock = await db.Stock.create(stockData);
                    console.log('✅ Stock created successfully with ID:', newStock.id);
                    console.log('Created stock data:', JSON.stringify(newStock.dataValues, null, 2));
                } catch (createError) {
                    console.error('❌ Stock creation failed with error:', createError);
                    console.error('Error details:', {
                        message: createError.message,
                        name: createError.name,
                        stack: createError.stack,
                        sql: createError.sql,
                        parameters: createError.parameters
                    });
                    throw createError;
                }
                
                // Only update approval status AFTER successful stock creation
                console.log('Updating status to approved...');
                await db.ApprovalRequest.update({
                    status: 'approved',
                    approvedBy: req.user.id,
                    approvedAt: new Date(),
                    remarks: remarks || null
                }, {
                    where: { id: id }
                });
                console.log('✅ Approval status updated successfully');
                
            } catch (stockError) {
                console.error('❌ Error executing stock request:', stockError);
                console.error('Stock error details:', {
                    message: stockError.message,
                    stack: stockError.stack,
                    name: stockError.name
                });
                
                // Don't update approval status if stock creation failed
                throw new Error(`Failed to execute stock request: ${stockError.message}`);
            }
        } else if (approvalRequest.type === 'dispose') {
            console.log('Executing dispose request...');
            console.log('Dispose request data:', JSON.stringify(approvalRequest.requestData, null, 2));
            
            try {
                // Check if dispose service is available
                if (!disposeService) {
                    throw new Error('Dispose service is not available');
                }
                console.log('Dispose service is available');
                
                // Check if disposeService.create method exists
                if (typeof disposeService.create !== 'function') {
                    throw new Error('disposeService.create method is not available');
                }
                console.log('disposeService.create method is available');
                
                // Execute dispose request
                const disposeResult = await disposeService.create(approvalRequest.requestData);
                console.log('✅ Dispose request executed successfully:', disposeResult);
                
                // Only update approval status AFTER successful dispose execution
                console.log('Updating status to approved...');
                await db.ApprovalRequest.update({
                    status: 'approved',
                    approvedBy: req.user.id,
                    approvedAt: new Date(),
                    remarks: remarks || null
                }, {
                    where: { id: id }
                });
                console.log('✅ Approval status updated successfully');
                
            } catch (disposeError) {
                console.error('❌ Error executing dispose request:', disposeError);
                console.error('Dispose error details:', {
                    message: disposeError.message,
                    stack: disposeError.stack,
                    name: disposeError.name
                });
                // Don't update approval status if dispose execution failed
                throw new Error(`Failed to execute dispose request: ${disposeError.message}`);
            }
        } else {
            console.log('❌ Unknown request type:', approvalRequest.type);
            return res.status(400).json({ message: 'Unknown request type' });
        }

        // Get the updated request with simple query
        try {
            const updatedRequest = await db.ApprovalRequest.findByPk(id);
            console.log('✅ Approval completed successfully');
            res.json({
                id: updatedRequest.id,
                type: updatedRequest.type,
                status: updatedRequest.status,
                requestData: updatedRequest.requestData,
                createdBy: updatedRequest.createdBy,
                approvedBy: updatedRequest.approvedBy,
                approvedAt: updatedRequest.approvedAt,
                remarks: updatedRequest.remarks,
                createdAt: updatedRequest.createdAt,
                updatedAt: updatedRequest.updatedAt
            });
        } catch (responseError) {
            console.error('❌ Error getting updated request:', responseError);
            res.json({ message: 'Approval completed successfully' });
        }
    } catch (error) {
        console.error('❌ Error in approve function:', error);
        console.error('Error stack:', error.stack);
        console.error('Error message:', error.message);
        
        // Return a more detailed error response
        res.status(500).json({
            message: 'Internal server error during approval',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

// PUT /api/approval-requests/:id/reject - Reject request
exports.reject = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rejectionReason, remarks } = req.body;

        if (!rejectionReason) {
            return res.status(400).json({ message: 'Rejection reason is required' });
        }

        // Get the approval request
        const approvalRequest = await approvalRequestService.getById(id);
        if (!approvalRequest) {
            return res.status(404).json({ message: 'Approval request not found' });
        }

        if (approvalRequest.status !== 'pending') {
            return res.status(400).json({ message: 'Request is not pending' });
        }

        // Update status to rejected
        const updatedRequest = await approvalRequestService.updateStatus(id, 'rejected', req.user.id, rejectionReason, remarks);
        res.json(updatedRequest);
    } catch (error) {
        next(error);
    }
};

// DELETE /api/approval-requests/:id - Delete approval request (Staff can delete their own pending requests)
exports._delete = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Get the approval request
        const approvalRequest = await approvalRequestService.getById(id);
        if (!approvalRequest) {
            return res.status(404).json({ message: 'Approval request not found' });
        }

        // Check if user can delete this request
        if (approvalRequest.createdBy !== req.user.id && !['SuperAdmin', 'Admin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized to delete this request' });
        }

        // Only allow deletion of pending requests
        if (approvalRequest.status !== 'pending') {
            return res.status(400).json({ message: 'Only pending requests can be deleted' });
        }

        await approvalRequestService.delete(id);
        res.json({ message: 'Approval request deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// GET /api/approval-requests/stats/pending - Get pending requests count
exports.getPendingCount = async (req, res, next) => {
    try {
        const count = await approvalRequestService.getPendingCount();
        res.json({ count });
    } catch (error) {
        next(error);
    }
};

// Helper function to clean and validate stock data
function cleanStockData(data) {
    console.log('Cleaning stock data:', JSON.stringify(data, null, 2));
    
    const cleaned = {
        itemId: parseInt(data.itemId),
        locationId: parseInt(data.locationId),
        quantity: parseInt(data.quantity),
        price: parseFloat(data.price),
        remarks: data.remarks || '',
        receiptAttachment: data.receiptAttachment || null,
        disposeId: data.disposeId ? parseInt(data.disposeId) : null
    };
    
    console.log('Cleaned stock data:', JSON.stringify(cleaned, null, 2));
    return cleaned;
}

// Helper function to execute stock request
async function executeStockRequest(requestData, createdBy) {
    console.log('=== EXECUTE STOCK REQUEST DEBUG ===');
    console.log('Request Data:', JSON.stringify(requestData, null, 2));
    console.log('Created By:', createdBy);
    console.log('Is Array:', Array.isArray(requestData));
    
    try {
        // Handle multiple stock entries
        if (Array.isArray(requestData)) {
            console.log('Processing array of stock entries...');
            for (let i = 0; i < requestData.length; i++) {
                console.log(`Processing stock entry ${i + 1}:`, JSON.stringify(requestData[i], null, 2));
                const cleanedData = cleanStockData(requestData[i]);
                await stockService.create(cleanedData, createdBy);
                console.log(`✅ Stock entry ${i + 1} created successfully`);
            }
        } else {
            console.log('Processing single stock entry...');
            console.log('Stock data to create:', JSON.stringify(requestData, null, 2));
            console.log('User ID for creation:', createdBy);
            
            // Clean and validate the data
            const cleanedData = cleanStockData(requestData);
            
            // Validate required fields after cleaning
            if (!cleanedData.itemId || isNaN(cleanedData.itemId)) {
                throw new Error('Invalid or missing itemId in request data');
            }
            if (!cleanedData.locationId || isNaN(cleanedData.locationId)) {
                throw new Error('Invalid or missing locationId in request data');
            }
            if (!cleanedData.price || isNaN(cleanedData.price)) {
                throw new Error('Invalid or missing price in request data');
            }
            if (!cleanedData.quantity || isNaN(cleanedData.quantity)) {
                throw new Error('Invalid or missing quantity in request data');
            }
            
            const result = await stockService.create(cleanedData, createdBy);
            console.log('✅ Single stock entry created successfully:', result.id);
        }
        console.log('✅ All stock entries processed successfully');
    } catch (error) {
        console.error('❌ Error in executeStockRequest:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            requestData: requestData,
            createdBy: createdBy
        });
        throw error;
    }
}

// Helper function to execute dispose request
