const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        pcId: { 
            type: DataTypes.INTEGER, 
            allowNull: false,
            references: {
                model: 'PCs',
                key: 'id'
            }
        },
        itemId: { 
            type: DataTypes.INTEGER, 
            allowNull: false,
            references: {
                model: 'Items',
                key: 'id'
            }
        },
        quantity: { type: DataTypes.INTEGER, allowNull: false },
        price: { type: DataTypes.FLOAT, allowNull: false },
        totalPrice: { type: DataTypes.FLOAT, allowNull: false },
        stockId: { 
            type: DataTypes.INTEGER, 
            allowNull: true,
            references: {
                model: 'Stocks',
                key: 'id'
            }
        },
        remarks: { type: DataTypes.TEXT, allowNull: true },
        status: { 
            type: DataTypes.ENUM('Working', 'Missing', 'Not Working', 'Maintenance'),
            allowNull: false,
            defaultValue: 'Working'
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
                    { model: sequelize.models.PC, as: 'pc', attributes: ['id', 'name'] },
                    { model: sequelize.models.Item, as: 'item', attributes: ['id', 'name'] },
                    { model: sequelize.models.Stock, as: 'stock', attributes: ['id', 'quantity', 'price'] }
                ]
            }
        }
    };

    return sequelize.define('PCComponent', attributes, options);
} 