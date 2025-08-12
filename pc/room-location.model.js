const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        building: { type: DataTypes.STRING, allowNull: true },
        floor: { type: DataTypes.STRING, allowNull: true },
        roomNumber: { type: DataTypes.STRING, allowNull: true },
        capacity: { type: DataTypes.INTEGER, allowNull: true },
        status: { 
            type: DataTypes.ENUM('Active', 'Inactive', 'Maintenance'),
            allowNull: false,
            defaultValue: 'Active'
        },
        createdBy: { type: DataTypes.INTEGER, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    };

    const options = {
        timestamps: true,
        scopes: {
            withAssociations: {
                include: [
                    { model: sequelize.models.PC, as: 'pcs', attributes: ['id', 'name'] }
                ]
            }
        }
    };

    return sequelize.define('RoomLocation', attributes, options);
} 