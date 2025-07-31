const db = require('../_helpers/db');

module.exports = {
    getAll,
    getById,
    create,
    update,
    delete: _delete
};

// Get all stock logs (include item + location)
async function getAll() {
    return await db.Stock.findAll({
        include: [
            { model: db.Item, as: 'item', attributes: ['id', 'name'] },
            { model: db.StorageLocation, as: 'location', attributes: ['id', 'name'] }
        ]
    });
}

// Get single stock log
async function getById(id) {
    return await getStock(id);
}

// Create new stock log
async function create(params, userId) {
    if (!params.itemId) throw 'Item is required';
    if (!params.type) throw 'Type (ADD or DISPOSE) is required';
    if (!params.locationId) throw 'Location is required';
    if (!params.price) throw 'Price is required';

    // Calculate total price
    const totalPrice = params.quantity * params.price;

    const stock = await db.Stock.create({
        itemId: params.itemId,
        quantity: params.quantity,
        type: params.type,
        locationId: params.locationId,
        price: params.price,
        totalPrice: totalPrice,
        remarks: params.remarks,
        createdBy: userId
    });

    return stock;
}

// Update stock log
async function update(id, params) {
    const stock = await getStock(id);

    // Update fields
    stock.quantity = params.quantity ?? stock.quantity;
    stock.type = params.type ?? stock.type;
    stock.locationId = params.locationId ?? stock.locationId;
    stock.price = params.price ?? stock.price;

    // Recalculate total price
    stock.totalPrice = stock.quantity * stock.price;

    stock.remarks = params.remarks ?? stock.remarks;

    await stock.save();
    return stock;
}

// Delete stock log
async function _delete(id) {
    const stock = await getStock(id);
    await stock.destroy();
}

// Helper
async function getStock(id) {
    const stock = await db.Stock.findByPk(id, {
        include: [
            { model: db.Item, as: 'item', attributes: ['id', 'name'] },
            { model: db.StorageLocation, as: 'location', attributes: ['id', 'name'] }
        ]
    });
    if (!stock) throw 'Stock not found';
    return stock;
}
