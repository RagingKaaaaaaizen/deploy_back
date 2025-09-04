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
        attributes: ['id', 'itemId', 'quantity', 'price', 'totalPrice', 'locationId', 'remarks', 'receiptAttachment', 'disposeId', 'createdAt', 'createdBy'],
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
        attributes: ['id', 'itemId', 'quantity', 'price', 'totalPrice', 'locationId', 'remarks', 'receiptAttachment', 'disposeId', 'createdAt', 'createdBy'],
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
    console.log('=== STOCK SERVICE CREATE DEBUG ===');
    console.log('Params received:', JSON.stringify(params, null, 2));
    console.log('User ID received:', userId);
    console.log('Params type:', typeof params);
    console.log('User ID type:', typeof userId);
    
    if (!params.itemId) {
        console.error('❌ Missing itemId');
        throw 'Item is required';
    }
    if (!params.locationId) {
        console.error('❌ Missing locationId');
        throw 'Location is required';
    }
    if (!params.price) {
        console.error('❌ Missing price');
        throw 'Price is required';
    }
    if (!userId) {
        console.error('❌ Missing userId');
        throw 'User ID is required';
    }

    // Calculate total price
    const totalPrice = params.quantity * params.price;
    console.log('Calculated total price:', totalPrice);

    const stockData = {
        ...params,
        totalPrice: totalPrice,
        createdBy: userId
    };
    
    console.log('Final stock data to create:', JSON.stringify(stockData, null, 2));

    let stock;
    try {
        stock = await db.Stock.create(stockData);
        console.log('✅ Stock created successfully with ID:', stock.id);
    } catch (dbError) {
        console.error('❌ Database error creating stock:', dbError);
        console.error('Stock data that failed:', JSON.stringify(stockData, null, 2));
        throw new Error(`Database error creating stock: ${dbError.message}`);
    }
    
    // Log activity after successful stock creation
    try {
        console.log('Logging activity for stock creation...');
        const item = await db.Item.findByPk(params.itemId, {
            include: [
                { model: db.Category, as: 'category', attributes: ['name'] },
                { model: db.Brand, as: 'brand', attributes: ['name'] }
            ]
        });
        
        if (!item) {
            console.warn('⚠️ Item not found for activity logging:', params.itemId);
        }
        
        const location = await db.StorageLocation.findByPk(params.locationId);
        if (!location) {
            console.warn('⚠️ Location not found for activity logging:', params.locationId);
        }
        
        const user = await db.Account.findByPk(userId);
        if (!user) {
            console.warn('⚠️ User not found for activity logging:', userId);
        }
        
        const activityData = {
            userId: userId,
            action: 'ADD_STOCK',
            entityType: 'STOCK',
            entityId: stock.id,
            entityName: `Added ${params.quantity} units of ${item?.name || 'Unknown Item'} to ${location?.name || 'Unknown Location'}`,
            details: { 
                itemId: params.itemId,
                itemName: item?.name || 'Unknown Item',
                categoryName: item?.category?.name || 'Unknown Category',
                brandName: item?.brand?.name || 'Unknown Brand',
                locationId: params.locationId,
                locationName: location?.name || 'Unknown Location',
                quantity: params.quantity,
                price: params.price,
                totalPrice: totalPrice,
                createdBy: user ? `${user.firstName} ${user.lastName}` : 'Unknown User'
            }
        };
        
        console.log('Activity data to log:', JSON.stringify(activityData, null, 2));
        await activityLogService.logActivity(activityData);
        console.log('✅ Activity logged successfully');
    } catch (activityError) {
        console.error('❌ Failed to log stock creation activity:', activityError);
        // Don't throw error here, just log it - the stock was created successfully
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
