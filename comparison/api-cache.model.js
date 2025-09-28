const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        id: { 
            type: DataTypes.INTEGER, 
            autoIncrement: true, 
            primaryKey: true 
        },
        partIdentifier: { 
            type: DataTypes.STRING(200), 
            allowNull: false,
            comment: 'Unique identifier for the part (model number, UPC, etc.)'
        },
        apiProvider: { 
            type: DataTypes.STRING(50), 
            allowNull: false,
            comment: 'Which API provided this data'
        },
        cachedData: { 
            type: DataTypes.JSON, 
            allowNull: false,
            comment: 'The cached API response data'
        },
        expiresAt: { 
            type: DataTypes.DATE, 
            allowNull: false,
            comment: 'When this cache entry expires'
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
        indexes: [
            {
                unique: true,
                fields: ['partIdentifier', 'apiProvider'],
                name: 'unique_cache'
            },
            {
                fields: ['expiresAt']
            },
            {
                fields: ['apiProvider']
            }
        ],
        scopes: {
            expired: {
                where: {
                    expiresAt: {
                        [sequelize.Sequelize.Op.lt]: sequelize.Sequelize.literal('NOW()')
                    }
                }
            },
            byProvider: (provider) => ({
                where: { apiProvider: provider }
            }),
            valid: {
                where: {
                    expiresAt: {
                        [sequelize.Sequelize.Op.gt]: sequelize.Sequelize.literal('NOW()')
                    }
                }
            }
        }
    };

    return sequelize.define('ApiCache', attributes, options);
}
