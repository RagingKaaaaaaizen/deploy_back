const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        id: { 
            type: DataTypes.INTEGER, 
            autoIncrement: true, 
            primaryKey: true 
        },
        name: { 
            type: DataTypes.STRING, 
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true,
                len: [3, 255]
            }
        },
        description: { 
            type: DataTypes.TEXT, 
            allowNull: true 
        },
        createdBy: { 
            type: DataTypes.INTEGER, 
            allowNull: true,
            references: {
                model: 'Accounts',
                key: 'id'
            }
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
        tableName: 'PCBuildTemplates',
        scopes: {
            withComponents: {
                include: [
                    { 
                        model: sequelize.models.PCBuildTemplateComponent, 
                        as: 'components',
                        include: [
                            { model: sequelize.models.Category, as: 'category' },
                            { model: sequelize.models.Item, as: 'item' }
                        ]
                    }
                ]
            },
            withUser: {
                include: [
                    { model: sequelize.models.Account, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'email'] }
                ]
            }
        }
    };

    return sequelize.define('PCBuildTemplate', attributes, options);
}

