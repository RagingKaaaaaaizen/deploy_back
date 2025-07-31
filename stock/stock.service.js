const db = require('../_helpers/db');

module.exports = {
    getAll,
    getById,
    create,
    update,
    delete: _delete,
    getAvailableStock
};

// Get all stock logs (include item + location)
async function getAll() {
    return await db.Stock.findAll({
        include: [
            { 
                model: db.Item, 
                as: 'item', 
                attributes: ['id', 'name'],
                include: [
                    { model: db.Category, as: 'category', attributes: ['id', 'name'] },
                    { model: db.Brand, as: 'brand', attributes: ['id', 'name'] }
                ]
            },
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
    if (!params.locationId) throw 'Location is required';
    if (!params.price) throw 'Price is required';
    if (!userId) throw 'User ID is required';

    // Calculate total price
    const totalPrice = params.quantity * params.price;

    const stockData = {
        ...params,
        totalPrice: totalPrice,
        createdBy: userId
    };

    const stock = await db.Stock.create(stockData);
    
    return stock;
}

// Update stock log
async function update(id, params) {
    const stock = await getStock(id);

    // Update fields
    Object.assign(stock, params);
    await stock.save();
    
    return stock;
}

// Delete stock log
async function _delete(id) {
    const stock = await getStock(id);
    await stock.destroy();
}

// Get available stock for an item
async function getAvailableStock(itemId) {
    const stockLogs = await db.Stock.findAll({
        where: { itemId },
        include: [
            { 
                model: db.Item, 
                as: 'item', 
                attributes: ['id', 'name'],
                include: [
                    { model: db.Category, as: 'category', attributes: ['id', 'name'] },
                    { model: db.Brand, as: 'brand', attributes: ['id', 'name'] }
                ]
            },
            { model: db.StorageLocation, as: 'location', attributes: ['id', 'name'] }
        ]
    });

    // Calculate available stock
    let availableStock = 0;
    stockLogs.forEach(entry => {
        if (entry.disposeId) {
            // This is a disposal entry
            availableStock -= entry.quantity;
        } else {
            // This is an addition entry
            availableStock += entry.quantity;
        }
    });

    // Ensure stock doesn't go negative
    availableStock = Math.max(0, availableStock);

    return {
        itemId,
        availableStock,
        stockLogs,
        totalAdded: stockLogs.filter(s => !s.disposeId).reduce((sum, s) => sum + s.quantity, 0),
        totalDisposed: stockLogs.filter(s => s.disposeId).reduce((sum, s) => sum + s.quantity, 0)
    };
}

// Helper
async function getStock(id) {
    const stock = await db.Stock.findByPk(id, {
        include: [
            { 
                model: db.Item, 
                as: 'item', 
                attributes: ['id', 'name'],
                include: [
                    { model: db.Category, as: 'category', attributes: ['id', 'name'] },
                    { model: db.Brand, as: 'brand', attributes: ['id', 'name'] }
                ]
            },
            { model: db.StorageLocation, as: 'location', attributes: ['id', 'name'] }
        ]
    });
    if (!stock) throw 'Stock not found';
    return stock;
}
