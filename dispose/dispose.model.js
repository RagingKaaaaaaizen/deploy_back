module.exports = (sequelize, DataTypes) => {
    const Dispose = sequelize.define('Dispose', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        itemId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'items',
                key: 'id'
            }
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 0
            }
        },
        disposalValue: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0
        },
        totalValue: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0
        },
        locationId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'storagelocations',
                key: 'id'
            }
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        disposalDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'accounts',
                key: 'id'
            }
        },
        returnedToStock: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        returnedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        returnedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'accounts',
                key: 'id'
            }
        },
        sourceStockId: {
            type: DataTypes.INTEGER,
            allowNull: true
            // Removed foreign key constraint to avoid circular dependency
            // We'll handle the relationship in the application logic
        }
    }, {
        tableName: 'disposes',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    });

    return Dispose;
}; 