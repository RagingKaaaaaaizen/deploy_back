const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        id: { 
            type: DataTypes.INTEGER, 
            autoIncrement: true, 
            primaryKey: true 
        },
        itemId: { 
            type: DataTypes.INTEGER, 
            allowNull: false,
            references: {
                model: 'Items',
                key: 'id'
            }
        },
        specName: { 
            type: DataTypes.STRING(100), 
            allowNull: false 
        },
        specValue: { 
            type: DataTypes.TEXT, 
            allowNull: true 
        },
        specUnit: { 
            type: DataTypes.STRING(50), 
            allowNull: true 
        },
        source: { 
            type: DataTypes.ENUM('manual', 'pcpartpicker', 'amazon', 'newegg', 'scraped'),
            allowNull: false,
            defaultValue: 'pcpartpicker'
        },
        confidence: { 
            type: DataTypes.DECIMAL(3, 2), 
            allowNull: false,
            defaultValue: 1.0,
            comment: 'AI confidence score for this specification'
        },
        lastUpdated: { 
            type: DataTypes.DATE, 
            allowNull: false,
            defaultValue: DataTypes.NOW 
        },
        createdAt: { 
            type: DataTypes.DATE, 
            allowNull: false,
            defaultValue: DataTypes.NOW 
        }
    };

    const options = {
        timestamps: false, // We're managing timestamps manually
        indexes: [
            {
                fields: ['itemId', 'specName']
            },
            {
                fields: ['source']
            },
            {
                fields: ['lastUpdated']
            }
        ],
        scopes: {
            withItem: {
                include: [
                    { model: sequelize.models.Item, as: 'item', attributes: ['id', 'name', 'description'] }
                ]
            },
            bySource: (source) => ({
                where: { source: source }
            }),
            recent: {
                where: {
                    lastUpdated: {
                        [sequelize.Sequelize.Op.gte]: sequelize.Sequelize.literal('DATE_SUB(NOW(), INTERVAL 30 DAY)')
                    }
                }
            }
        }
    };

    return sequelize.define('PartSpecification', attributes, options);
}
