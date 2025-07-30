const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Item = sequelize.define('Item', {
        // attributes
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        // Foreign key for ItemCategory
        categoryId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'ItemCategories', // This is the table name
                key: 'id'
            }
        }
        // Add more fields as needed (e.g., serialNumber, purchaseDate, location, status)
    });

    return Item;
};
