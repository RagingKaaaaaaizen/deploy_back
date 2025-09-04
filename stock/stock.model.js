const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        itemId: { type: DataTypes.INTEGER, allowNull: false },  // Reference by ID only
        quantity: { type: DataTypes.INTEGER, allowNull: false },
        locationId: { type: DataTypes.INTEGER, allowNull: false }, // NEW FIELD
        price: { type: DataTypes.FLOAT, allowNull: false },       // NEW
        totalPrice: { type: DataTypes.FLOAT, allowNull: false },
        remarks: { type: DataTypes.TEXT, allowNull: true },       // NEW FIELD
        receiptAttachment: { type: DataTypes.STRING, allowNull: true }, // NEW: Receipt file path
        disposeId: { type: DataTypes.INTEGER, allowNull: true },  // NEW: Link to dispose record
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        createdBy: { type: DataTypes.INTEGER, allowNull: false } // Reference by ID only
    };

    const options = { timestamps: false };
    return sequelize.define('Stock', attributes, options);
}
