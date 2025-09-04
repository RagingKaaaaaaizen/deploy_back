module.exports = (sequelize, DataTypes) => {
    const ApprovalRequest = sequelize.define('ApprovalRequest', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        type: {
            type: DataTypes.ENUM('stock', 'dispose'),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            defaultValue: 'pending'
        },
        requestData: {
            type: DataTypes.JSON,
            allowNull: false,
            comment: 'JSON data containing the request details (stock/dispose information)'
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'User ID who created the request'
        },
        approvedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'User ID who approved/rejected the request'
        },
        approvedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        rejectionReason: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Reason for rejection if status is rejected'
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Additional remarks from the approver'
        }
    }, {
        tableName: 'approval_requests',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    });

    return ApprovalRequest;
};
