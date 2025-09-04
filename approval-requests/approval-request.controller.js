const approvalRequestService = require('./approval-request.service');
const stockService = require('../stock/stock.service');
const disposeService = require('../dispose/dispose.service');

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
        console.log('User ID:', req.user.id);
        console.log('User Role:', req.user.role);
        console.log('Remarks:', remarks);

        // Get the approval request
        const approvalRequest = await approvalRequestService.getById(id);
        console.log('Approval Request Found:', approvalRequest ? 'Yes' : 'No');
        
        if (!approvalRequest) {
            console.log('❌ Approval request not found for ID:', id);
            return res.status(404).json({ message: 'Approval request not found' });
        }

        console.log('Current Status:', approvalRequest.status);
        console.log('Request Type:', approvalRequest.type);
        console.log('Request Data:', approvalRequest.requestData);

        if (approvalRequest.status !== 'pending') {
            console.log('❌ Request is not pending, current status:', approvalRequest.status);
            return res.status(400).json({ message: 'Request is not pending' });
        }

        // Update status to approved
        console.log('Updating status to approved...');
        await approvalRequestService.updateStatus(id, 'approved', req.user.id, null, remarks);

        // Execute the actual request based on type
        console.log('Executing request of type:', approvalRequest.type);
        if (approvalRequest.type === 'stock') {
            console.log('Executing stock request with data:', approvalRequest.requestData);
            console.log('Created by user ID:', approvalRequest.createdBy);
            await executeStockRequest(approvalRequest.requestData, approvalRequest.createdBy);
            console.log('✅ Stock request executed successfully');
        } else if (approvalRequest.type === 'dispose') {
            console.log('Executing dispose request...');
            await executeDisposeRequest(approvalRequest.requestData);
            console.log('✅ Dispose request executed successfully');
        }

        const updatedRequest = await approvalRequestService.getById(id);
        console.log('✅ Approval completed successfully');
        res.json(updatedRequest);
    } catch (error) {
        console.error('❌ Error in approve function:', error);
        next(error);
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

// Helper function to execute stock request
async function executeStockRequest(requestData, createdBy) {
    // Handle multiple stock entries
    if (Array.isArray(requestData)) {
        for (const stockData of requestData) {
            await stockService.create(stockData, createdBy);
        }
    } else {
        await stockService.create(requestData, createdBy);
    }
}

// Helper function to execute dispose request
async function executeDisposeRequest(requestData) {
    await disposeService.create(requestData);
}
