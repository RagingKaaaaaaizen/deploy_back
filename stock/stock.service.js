const db = require('../_helpers/db');
const activityLogService = require('../activity-log/activity-log.service');

module.exports = {
    getAll,
    getById,
    create,
    update,
    delete: _delete,
    getAvailableStock
};

// Get all stock logs (include complete item + location info)
async function getAll() {
    return await db.Stock.findAll({
        // Temporarily removed quantity filter to debug returned items
        attributes: ['id', 'itemId', 'quantity', 'price', 'totalPrice', 'locationId', 'remarks', 'disposeId', 'createdAt', 'createdBy'],
        include: [
            { 
                model: db.Item, 
                as: 'item', 
                attributes: ['id', 'name', 'description'],
                include: [
                    { model: db.Category, as: 'category', attributes: ['id', 'name'] },
                    { model: db.Brand, as: 'brand', attributes: ['id', 'name'] }
                ]
            },
            { model: db.StorageLocation, as: 'location', attributes: ['id', 'name', 'description'] },
            { model: db.Account, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
            { 
                model: db.Dispose, 
                as: 'disposal', 
                attributes: ['id', 'quantity', 'disposalValue', 'reason', 'disposalDate', 'returnedToStock', 'returnedAt', 'returnedBy'],
                required: false // Left join to include disposal info if available
            }
        ],
        order: [['createdAt', 'DESC']]
    });
}

// Get single stock log with complete information
async function getById(id) {
    return await db.Stock.findByPk(id, {
        attributes: ['id', 'itemId', 'quantity', 'price', 'totalPrice', 'locationId', 'remarks', 'disposeId', 'createdAt', 'createdBy'],
        include: [
            { 
                model: db.Item, 
                as: 'item', 
                attributes: ['id', 'name', 'description'],
                include: [
                    { model: db.Category, as: 'category', attributes: ['id', 'name'] },
                    { model: db.Brand, as: 'brand', attributes: ['id', 'name'] }
                ]
            },
            { model: db.StorageLocation, as: 'location', attributes: ['id', 'name', 'description'] },
            { model: db.Account, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }
        ]
    });
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
    
    // Log activity after successful stock creation
    try {
        const item = await db.Item.findByPk(params.itemId, {
            include: [
                { model: db.Category, as: 'category', attributes: ['name'] },
                { model: db.Brand, as: 'brand', attributes: ['name'] }
            ]
        });
        const location = await db.StorageLocation.findByPk(params.locationId);
        const user = await db.Account.findByPk(userId);
        
        await activityLogService.logActivity({
            userId: userId,
            action: 'ADD_STOCK',
            entityType: 'STOCK',
            entityId: stock.id,
            entityName: `Added ${params.quantity} units of ${item.name} (${item.brand.name} - ${item.category.name}) to ${location.name}`,
            details: { 
                itemId: params.itemId,
                itemName: item.name,
                categoryName: item.category.name,
                brandName: item.brand.name,
                locationId: params.locationId,
                locationName: location.name,
                quantity: params.quantity,
                price: params.price,
                totalPrice: totalPrice,
                createdBy: user ? `${user.firstName} ${user.lastName}` : 'Unknown User'
            }
        });
    } catch (error) {
        console.error('Failed to log stock creation activity:', error);
    }
    
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

// Helper function to get stock by id
async function getStock(id) {
    const stock = await db.Stock.findByPk(id);
    if (!stock) throw 'Stock not found';
    return stock;
}

// Get available stock for an item
async function getAvailableStock(itemId) {
    const stocks = await db.Stock.findAll({
        where: { itemId: itemId },
        include: [
            { model: db.Item, as: 'item', attributes: ['id', 'name'] },
            { model: db.StorageLocation, as: 'location', attributes: ['id', 'name'] }
        ]
    });

    let totalAvailable = 0;
    const stockDetails = [];

    for (const stock of stocks) {
        // Only skip stock entries that have been fully disposed (quantity = 0)
        // Allow partial disposals to be included in available stock
        if (stock.quantity <= 0) {
            continue;
        }

        totalAvailable += stock.quantity;
        stockDetails.push({
            id: stock.id,
            quantity: stock.quantity,
            price: stock.price,
            location: stock.location.name,
            remarks: stock.remarks,
            createdAt: stock.createdAt
        });
    }

    return {
        totalAvailable,
        stockDetails
    };
}
