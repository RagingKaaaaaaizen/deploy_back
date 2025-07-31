const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        serialNumber: { type: DataTypes.STRING, allowNull: true, unique: true },
        itemId: { 
            type: DataTypes.INTEGER, 
            allowNull: false,
            references: {
                model: 'Items',
                key: 'id'
            }
        },
        roomLocationId: { 
            type: DataTypes.INTEGER, 
            allowNull: false,
            references: {
                model: 'StorageLocations',
                key: 'id'
            }
        },
        // Specifications (stored as JSON to be flexible based on category)
        specifications: { type: DataTypes.TEXT, allowNull: true }, // JSON string for dynamic specs
        // Status and Assignment
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
        scopes: {
            withAssociations: {
                include: [
                    { 
                        model: sequelize.models.Item, 
                        as: 'item', 
                        attributes: ['id', 'name', 'description'],
                        include: [
                            { model: sequelize.models.Category, as: 'category', attributes: ['id', 'name'] },
                            { model: sequelize.models.Brand, as: 'brand', attributes: ['id', 'name'] }
                        ]
                    },
                    { model: sequelize.models.StorageLocation, as: 'roomLocation', attributes: ['id', 'name'] }
                ]
            }
        }
    };

    return sequelize.define('PC', attributes, options);
} 