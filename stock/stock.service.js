const db = require('../_helpers/db');

module.exports = {
    getAll,
    getById,
    create,
    update,
    delete: _delete
};

// Get all stock logs
async function getAll() {
    return await db.Stock.findAll();
}

// Get single stock log
async function getById(id) {
    return await getStock(id);
}

// Create new stock log
async function create(params, userId) {
    if (!params.itemId) throw 'Item is required';
    if (!params.type) throw 'Type (ADD or DISPOSE) is required';
    if (!params.location) throw 'Location is required';

    const stock = await db.Stock.create({
        ...params,
        createdBy: userId
    });

    return stock;
}

// Update stock log
async function update(id, params) {
    const stock = await getStock(id);
    Object.assign(stock, params);
    await stock.save();
    return stock;
}

// Delete stock log
async function _delete(id) {
    const stock = await getStock(id);
    await stock.destroy();
}

async function getAll() {
    return await db.Stock.findAll({
        include: [
            { model: db.Item, attributes: ['id', 'name'] }  // join to get item name
        ]
    });
}
// Helper
async function getStock(id) {
    const stock = await db.Stock.findByPk(id);
    if (!stock) throw 'Stock not found';
    return stock;
}
