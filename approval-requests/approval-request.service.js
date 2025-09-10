const db = require('../_helpers/db');
const { ApprovalRequest, Account } = db;

// Create a new approval request
async function create(requestData) {
    return await ApprovalRequest.create(requestData);
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

// Get approval request by ID with detailed related data
async function getById(id) {
    const approvalRequest = await ApprovalRequest.findByPk(id, {
        include: [
            {
                model: Account,
                as: 'creator',
                attributes: ['id', 'firstName', 'lastName', 'email', 'role']
            },
            {
                model: Account,
                as: 'approver',
                attributes: ['id', 'firstName', 'lastName', 'email', 'role']
            }
        ]
    });

    if (!approvalRequest) {
        return null;
    }

    // Enhanced request data with detailed information
    let enhancedRequestData = { ...approvalRequest.requestData };

    try {
        // Parse requestData if it's stored as a string
        if (typeof approvalRequest.requestData === 'string') {
            enhancedRequestData = JSON.parse(approvalRequest.requestData);
        }

        // Add detailed information based on request type
        if (approvalRequest.type === 'stock' && enhancedRequestData.itemId) {
            // Get item details
            const item = await db.Item.findByPk(enhancedRequestData.itemId, {
                include: [
                    { model: db.Category, attributes: ['id', 'name'] },
                    { model: db.Brand, attributes: ['id', 'name'] }
                ]
            });

            if (item) {
                enhancedRequestData.itemDetails = {
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    model: item.model,
                    serialNumber: item.serialNumber,
                    category: item.Category ? {
                        id: item.Category.id,
                        name: item.Category.name
                    } : null,
                    brand: item.Brand ? {
                        id: item.Brand.id,
                        name: item.Brand.name
                    } : null
                };
            }

            // Get storage location details
            if (enhancedRequestData.locationId) {
                const location = await db.StorageLocation.findByPk(enhancedRequestData.locationId);
                if (location) {
                    enhancedRequestData.locationDetails = {
                        id: location.id,
                        name: location.name,
                        description: location.description
                    };
                }
            }

            // Calculate total value
            if (enhancedRequestData.quantity && enhancedRequestData.price) {
                enhancedRequestData.totalValue = enhancedRequestData.quantity * enhancedRequestData.price;
            }
        }

        // Add enhanced data to the response
        const result = approvalRequest.toJSON();
        result.enhancedRequestData = enhancedRequestData;
        
        return result;

    } catch (error) {
        console.error('Error enhancing request data:', error);
        // Return original data if enhancement fails
        return approvalRequest;
    }
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
