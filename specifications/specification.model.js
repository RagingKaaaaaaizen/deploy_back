const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        categoryId: { 
            type: DataTypes.INTEGER, 
            allowNull: false,
            references: {
                model: 'Categories',
                key: 'id'
            }
        },
        fieldName: { type: DataTypes.STRING, allowNull: false },
        fieldLabel: { type: DataTypes.STRING, allowNull: false },
        fieldType: { 
            type: DataTypes.ENUM('text', 'textarea', 'number', 'select', 'date'),
            allowNull: false,
            defaultValue: 'text'
        },
        isRequired: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        fieldOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        options: { type: DataTypes.TEXT, allowNull: true }, // For select fields
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    };

    const options = {
        timestamps: true,
        scopes: {
            withCategory: {
                include: [
                    { model: sequelize.models.Category, as: 'category', attributes: ['id', 'name'] }
                ]
            }
        }
    };

    return sequelize.define('SpecificationField', attributes, options);
} 