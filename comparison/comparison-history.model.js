const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        id: { 
            type: DataTypes.INTEGER, 
            autoIncrement: true, 
            primaryKey: true 
        },
        userId: { 
            type: DataTypes.INTEGER, 
            allowNull: false,
            references: {
                model: 'Accounts',
                key: 'id'
            }
        },
        part1Id: { 
            type: DataTypes.INTEGER, 
            allowNull: false,
            references: {
                model: 'Items',
                key: 'id'
            },
            comment: 'First part being compared'
        },
        part2Id: { 
            type: DataTypes.INTEGER, 
            allowNull: false,
            references: {
                model: 'Items',
                key: 'id'
            },
            comment: 'Second part being compared'
        },
        comparisonType: { 
            type: DataTypes.ENUM('inventory_vs_inventory', 'inventory_vs_pc', 'inventory_vs_online'),
            allowNull: false
        },
        comparisonResult: { 
            type: DataTypes.JSON, 
            allowNull: true,
            comment: 'Detailed comparison results'
        },
        aiSummary: { 
            type: DataTypes.TEXT, 
            allowNull: true,
            comment: 'AI-generated user-friendly summary'
        },
        aiRecommendation: { 
            type: DataTypes.ENUM('part1_better', 'part2_better', 'similar', 'incompatible'),
            allowNull: true,
            comment: 'AI recommendation'
        },
        confidence: { 
            type: DataTypes.DECIMAL(3, 2), 
            allowNull: false,
            defaultValue: 0.0,
            comment: 'AI confidence in the comparison'
        },
        createdAt: { 
            type: DataTypes.DATE, 
            allowNull: false,
            defaultValue: DataTypes.NOW 
        }
    };

    const options = {
        timestamps: false, // We only track createdAt
        indexes: [
            {
                fields: ['userId', 'createdAt']
            },
            {
                fields: ['comparisonType']
            },
            {
                fields: ['createdAt']
            }
        ],
        scopes: {
            withUser: {
                include: [
                    { model: sequelize.models.Account, as: 'user', attributes: ['id', 'firstName', 'lastName'] }
                ]
            },
            withParts: {
                include: [
                    { model: sequelize.models.Item, as: 'part1', attributes: ['id', 'name', 'description'] },
                    { model: sequelize.models.Item, as: 'part2', attributes: ['id', 'name', 'description'] }
                ]
            },
            recent: (days = 30) => ({
                where: {
                    createdAt: {
                        [sequelize.Sequelize.Op.gte]: sequelize.Sequelize.literal(`DATE_SUB(NOW(), INTERVAL ${days} DAY)`)
                    }
                }
            }),
            byUser: (userId) => ({
                where: { userId: userId }
            }),
            byType: (type) => ({
                where: { comparisonType: type }
            })
        }
    };

    return sequelize.define('ComparisonHistory', attributes, options);
}
