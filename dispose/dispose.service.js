const db = require('../_helpers/db');

module.exports = {
    getAll,
    getById,
    create,
    update,
    delete: _delete,
    getDisposalsByItem,
    validateDisposal,
    getDisposalWithStock,
    getStockWithDisposal
};

// Get all disposal records
async function getAll() {
    return await db.Dispose.findAll({
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
            { model: db.StorageLocation, as: 'location', attributes: ['id', 'name'] },
            { model: db.Account, as: 'user', attributes: ['id', 'firstName', 'lastName'] }
        ],
        order: [['createdAt', 'DESC']]
    });
}

// Get single disposal record
async function getById(id) {
    return await getDisposal(id);
}

// Create new disposal record
async function create(params, userId) {
    console.log('=== CREATE DISPOSAL SERVICE ===');
    console.log('Parameters:', params);
    console.log('User ID:', userId);
    
    try {
        // Basic validation
        if (!params.itemId) throw 'Item is required';
        if (!params.quantity) throw 'Quantity is required';
        if (!params.locationId) throw 'Location is required';
        if (!userId) throw 'User ID is required';

        // Calculate total value
        const disposalValue = params.disposalValue || 0;
        const totalValue = params.quantity * disposalValue;
        console.log('Calculated total value:', totalValue);

        const disposalData = {
            itemId: params.itemId,
            quantity: params.quantity,
            disposalValue: disposalValue,
            totalValue: totalValue,
            locationId: params.locationId,
            reason: params.reason || '',
            disposalDate: new Date(),
            createdBy: userId
        };

        console.log('Creating disposal with data:', disposalData);

        const disposal = await db.Dispose.create(disposalData);
        console.log('Disposal record created successfully:', disposal.id);
        
        // Create corresponding stock entry for disposal
        const stockData = {
            itemId: params.itemId,
            quantity: params.quantity,
            locationId: params.locationId,
            price: disposalValue, // Use disposal value as price
            totalPrice: totalValue,
            remarks: `Disposal: ${params.reason || 'No reason provided'}`,
            disposeId: disposal.id, // Link to disposal record
            createdBy: userId
        };

        console.log('Creating stock entry for disposal:', stockData);
        const stockEntry = await db.Stock.create(stockData);
        console.log('Stock entry created successfully:', stockEntry.id);
        
        // Return simple disposal record without complex relationships
        return disposal;
    } catch (error) {
        console.error('Error in create disposal:', error);
        throw error;
    }
}

// Update disposal record
async function update(id, params) {
    const disposal = await getDisposal(id);

    // Update fields
    disposal.quantity = params.quantity ?? disposal.quantity;
    disposal.disposalValue = params.disposalValue ?? disposal.disposalValue;
    disposal.totalValue = disposal.quantity * disposal.disposalValue;
    disposal.locationId = params.locationId ?? disposal.locationId;
    disposal.reason = params.reason ?? disposal.reason;

    await disposal.save();
    return disposal;
}

// Delete disposal record
async function _delete(id) {
    const disposal = await getDisposal(id);
    await disposal.destroy();
}

// Get disposals for a specific item
async function getDisposalsByItem(itemId) {
    return await db.Dispose.findAll({
        where: { itemId },
        include: [
            { model: db.Item, as: 'item', attributes: ['id', 'name'] },
            { model: db.StorageLocation, as: 'location', attributes: ['id', 'name'] }
        ],
        order: [['createdAt', 'DESC']]
    });
}

// Validate disposal against available stock
async function validateDisposal(itemId, quantity) {
    console.log('=== VALIDATE DISPOSAL SERVICE ===');
    console.log('ItemId:', itemId, 'Quantity:', quantity);
    
    // Get all stock entries for this item
    const stockEntries = await db.Stock.findAll({
        where: { itemId }
    });
    
    console.log('Found stock entries:', stockEntries.length);
    console.log('Stock entries:', stockEntries.map(s => ({ id: s.id, itemId: s.itemId, quantity: s.quantity, disposeId: s.disposeId })));

    // Calculate available stock
    let availableStock = 0;
    stockEntries.forEach(entry => {
        if (entry.disposeId) {
            // This is a disposal entry
            availableStock -= entry.quantity;
            console.log('Subtracting disposal:', entry.quantity, 'New total:', availableStock);
        } else {
            // This is an addition entry
            availableStock += entry.quantity;
            console.log('Adding stock:', entry.quantity, 'New total:', availableStock);
        }
    });

    // Ensure stock doesn't go negative
    availableStock = Math.max(0, availableStock);
    console.log('Final available stock:', availableStock);

    // If quantity is 0, just return available stock info
    if (quantity === 0) {
        console.log('Quantity is 0, returning available stock info');
        return {
            valid: true,
            availableStock: availableStock
        };
    }

    if (quantity > availableStock) {
        console.log('Validation failed: quantity > availableStock');
        return {
            valid: false,
            message: `Cannot dispose ${quantity} items. Only ${availableStock} items available.`
        };
    }

    console.log('Validation successful');
    return {
        valid: true,
        availableStock: availableStock
    };
}

// Helper function
async function getDisposal(id) {
    const disposal = await db.Dispose.findByPk(id, {
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
            { model: db.StorageLocation, as: 'location', attributes: ['id', 'name'] },
            { model: db.Account, as: 'user', attributes: ['id', 'firstName', 'lastName'] }
        ]
    });
    if (!disposal) throw 'Disposal record not found';
    return disposal;
}

// Get disposal with related stock entries
async function getDisposalWithStock(disposalId) {
    const disposal = await getDisposal(disposalId);
    
    // Find related stock entries for this disposal
    const stockEntries = await db.Stock.findAll({
        where: {
            disposeId: disposalId
        },
        include: [
            { model: db.Item, as: 'item', attributes: ['id', 'name'] },
            { model: db.StorageLocation, as: 'location', attributes: ['id', 'name'] }
        ]
    });

    return {
        disposal,
        stockEntries
    };
}

// Get stock entries with disposal information
async function getStockWithDisposal(itemId) {
    const stockEntries = await db.Stock.findAll({
        where: { itemId },
        include: [
            { model: db.Item, as: 'item', attributes: ['id', 'name'] },
            { model: db.StorageLocation, as: 'location', attributes: ['id', 'name'] },
            { model: db.Dispose, as: 'disposal', attributes: ['id', 'quantity', 'disposalValue', 'reason', 'disposalDate'] }
        ],
        order: [['createdAt', 'DESC']]
    });

    return stockEntries;
} 