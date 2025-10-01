const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        id: { 
            type: DataTypes.INTEGER, 
            autoIncrement: true, 
            primaryKey: true 
        },
        templateId: { 
            type: DataTypes.INTEGER, 
            allowNull: false,
            references: {
                model: 'PCBuildTemplates',
                key: 'id'
            }
        },
        categoryId: { 
            type: DataTypes.INTEGER, 
            allowNull: false,
            references: {
                model: 'Categories',
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
        quantity: { 
            type: DataTypes.INTEGER, 
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 1
            }
        },
        remarks: { 
            type: DataTypes.TEXT, 
            allowNull: true 
        },
        createdAt: { 
            type: DataTypes.DATE, 
            allowNull: false, 
            defaultValue: DataTypes.NOW 
        },
        updatedAt: { 
            type: DataTypes.DATE, 
            allowNull: false, 
            defaultValue: DataTypes.NOW 
        }
    };

    const options = {
        timestamps: true,
        tableName: 'PCBuildTemplateComponents',
        indexes: [
            {
                unique: true,
                fields: ['templateId', 'categoryId'],
                name: 'unique_template_category'
            }
        ]
    };

    return sequelize.define('PCBuildTemplateComponent', attributes, options);
}

