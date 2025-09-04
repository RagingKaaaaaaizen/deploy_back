const approvalRequestService = require('./approval-request.service');
const stockService = require('../stock/stock.service');
const disposeService = require('../dispose/dispose.service');

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

        // Update status to approved with direct database update
        console.log('Updating status to approved...');
        try {
            await db.ApprovalRequest.update({
                status: 'approved',
                approvedBy: req.user.id,
                approvedAt: new Date(),
                remarks: remarks || null
            }, {
                where: { id: id }
            });
            console.log('✅ Approval status updated successfully');
        } catch (updateError) {
            console.error('❌ Error updating approval status:', updateError);
            return res.status(500).json({ message: 'Failed to update approval status' });
        }

        // Execute the actual request based on type
        console.log('Executing request of type:', approvalRequest.type);
        if (approvalRequest.type === 'stock') {
            console.log('Executing stock request with data:', approvalRequest.requestData);
            console.log('Created by user ID:', approvalRequest.createdBy);
            
            try {
                await executeStockRequest(approvalRequest.requestData, approvalRequest.createdBy);
                console.log('✅ Stock request executed successfully');
            } catch (stockError) {
                console.error('❌ Error executing stock request:', stockError);
                // Rollback the approval status update
                try {
                    await db.ApprovalRequest.update({
                        status: 'pending',
                        approvedBy: null,
                        approvedAt: null,
                        remarks: null
                    }, {
                        where: { id: id }
                    });
                    console.log('✅ Rollback completed - status reverted to pending');
                } catch (rollbackError) {
                    console.error('❌ Error during rollback:', rollbackError);
                }
                throw new Error(`Failed to execute stock request: ${stockError.message}`);
            }
        } else if (approvalRequest.type === 'dispose') {
            console.log('Executing dispose request...');
            try {
                await executeDisposeRequest(approvalRequest.requestData);
                console.log('✅ Dispose request executed successfully');
            } catch (disposeError) {
                console.error('❌ Error executing dispose request:', disposeError);
                // Rollback the approval status update
                try {
                    await db.ApprovalRequest.update({
                        status: 'pending',
                        approvedBy: null,
                        approvedAt: null,
                        remarks: null
                    }, {
                        where: { id: id }
                    });
                    console.log('✅ Rollback completed - status reverted to pending');
                } catch (rollbackError) {
                    console.error('❌ Error during rollback:', rollbackError);
                }
                throw new Error(`Failed to execute dispose request: ${disposeError.message}`);
            }
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
async function executeDisposeRequest(requestData) {
    await disposeService.create(requestData);
}
