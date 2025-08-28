const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        serialNumber: { type: DataTypes.STRING, allowNull: true, unique: true },
        roomLocationId: { 
            type: DataTypes.INTEGER, 
            allowNull: false
        },
        status: { 
            type: DataTypes.ENUM('Active', 'Inactive', 'Maintenance', 'Retired'),
            allowNull: false,
            defaultValue: 'Active'
        },
        assignedTo: { type: DataTypes.STRING, allowNull: true },
        notes: { type: DataTypes.TEXT, allowNull: true },
        createdBy: { type: DataTypes.INTEGER, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    };

    const options = {
        timestamps: true,
        tableName: 'PCs',
        scopes: {
            withAssociations: {
                include: [
                    { model: sequelize.models.RoomLocation, as: 'roomLocation', attributes: ['id', 'name'] }
                ]
            }
        }
    };

    return sequelize.define('PC', attributes, options);
} 