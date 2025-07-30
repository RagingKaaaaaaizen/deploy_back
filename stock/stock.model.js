const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        itemId: { type: DataTypes.INTEGER, allowNull: false },  // Reference by ID only
        quantity: { type: DataTypes.INTEGER, allowNull: false },
        type: { type: DataTypes.ENUM('ADD', 'DISPOSE'), allowNull: false },
        location: { type: DataTypes.STRING, allowNull: false }, // NEW FIELD
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        createdBy: { type: DataTypes.INTEGER, allowNull: false } // Reference by ID only
    };

    const options = { timestamps: false };
    return sequelize.define('Stock', attributes, options);
}
