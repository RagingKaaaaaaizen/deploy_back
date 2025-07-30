const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ItemCategory = sequelize.define('ItemCategory', {
        // attributes
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        }
    });

    return ItemCategory;
};