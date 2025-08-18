const { DataTypes } = require("sequelize");

module.exports = model;

function model(sequelize) {
    const attributes = {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        userId: { type: DataTypes.INTEGER, allowNull: false },
        action: { type: DataTypes.STRING(100), allowNull: false },
        entityType: { type: DataTypes.STRING(50), allowNull: false },
        entityId: { type: DataTypes.INTEGER, allowNull: true },
        entityName: { type: DataTypes.STRING(255), allowNull: true },
        details: { type: DataTypes.JSON, allowNull: true },
        ipAddress: { type: DataTypes.STRING(45), allowNull: true },
        userAgent: { type: DataTypes.TEXT, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    };

    const options = {
        timestamps: false,
        indexes: [
            { fields: ['userId'] },
            { fields: ['entityType', 'entityId'] },
            { fields: ['createdAt'] },
            { fields: ['action'] }
        ]
    };

    return sequelize.define('activity_log', attributes, options);
}
