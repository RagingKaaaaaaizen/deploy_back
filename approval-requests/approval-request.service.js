const db = require('../_helpers/db');
const { ApprovalRequest, Account } = db;

// Create a new approval request
async function create(requestData) {
    const approvalRequest = new ApprovalRequest(requestData);
    return await approvalRequest.save();
}

// Get all approval requests with creator and approver details
async function getAll() {
    return await ApprovalRequest.findAll({
        include: [
            {
                model: Account,
                as: 'creator',
                attributes: ['id', 'firstName', 'lastName', 'email']
            },
            {
                model: Account,
                as: 'approver',
                attributes: ['id', 'firstName', 'lastName', 'email']
            }
        ],
        order: [['createdAt', 'DESC']]
    });
}

// Get approval requests by creator (for staff to see their own requests)
async function getByCreator(createdBy) {
    return await ApprovalRequest.findAll({
        where: { createdBy },
        include: [
            {
                model: Account,
                as: 'creator',
                attributes: ['id', 'firstName', 'lastName', 'email']
            },
            {
                model: Account,
                as: 'approver',
                attributes: ['id', 'firstName', 'lastName', 'email']
            }
        ],
        order: [['createdAt', 'DESC']]
    });
}

// Get approval request by ID
async function getById(id) {
    return await ApprovalRequest.findByPk(id, {
        include: [
            {
                model: Account,
                as: 'creator',
                attributes: ['id', 'firstName', 'lastName', 'email']
            },
            {
                model: Account,
                as: 'approver',
                attributes: ['id', 'firstName', 'lastName', 'email']
            }
        ]
    });
}

// Update approval request status
async function updateStatus(id, status, approvedBy, rejectionReason = null, remarks = null) {
    const updateData = {
        status,
        approvedBy,
        approvedAt: new Date()
    };

    if (rejectionReason) {
        updateData.rejectionReason = rejectionReason;
    }

    if (remarks) {
        updateData.remarks = remarks;
    }

    await ApprovalRequest.update(updateData, {
        where: { id }
    });

    return await getById(id);
}

// Delete approval request
async function _delete(id) {
    const approvalRequest = await getById(id);
    if (!approvalRequest) {
        throw 'Approval request not found';
    }
    await approvalRequest.destroy();
}

// Get pending requests count
async function getPendingCount() {
    return await ApprovalRequest.count({
        where: { status: 'pending' }
    });
}

module.exports = {
    create,
    getAll,
    getByCreator,
    getById,
    updateStatus,
    delete: _delete,
    getPendingCount
};
