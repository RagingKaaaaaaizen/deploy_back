const db = require('../_helpers/db');

module.exports = {
    getAll,
    getById,
    getByPCId,
    getByItemId,
    create,
    update,
    delete: _delete,
    returnToStock
};

// Get all PC components
async function getAll() {
    return await db.PCComponent.findAll({
        include: [
            { model: db.PC, as: 'pc', attributes: ['id', 'name'] },
            { model: db.Item, as: 'item', attributes: ['id', 'name'] },
            { model: db.Stock, as: 'stock', attributes: ['id', 'quantity', 'price'] }
        ]
    });
}

// Get PC component by ID
async function getById(id) {
    return await getPCComponent(id);
}

// Get PC components by PC ID
async function getByPCId(pcId) {
    return await db.PCComponent.findAll({
        where: { pcId },
        include: [
            { model: db.PC, as: 'pc', attributes: ['id', 'name'] },
            { model: db.Item, as: 'item', attributes: ['id', 'name'] },
            { model: db.Stock, as: 'stock', attributes: ['id', 'quantity', 'price'] }
        ]
    });
}

// Get PC components by Item ID
async function getByItemId(itemId) {
    return await db.PCComponent.findAll({
        where: { itemId },
        include: [
            { model: db.PC, as: 'pc', attributes: ['id', 'name'] },
            { model: db.Item, as: 'item', attributes: ['id', 'name'] },
            { model: db.Stock, as: 'stock', attributes: ['id', 'quantity', 'price'] }
        ]
    });
}

// Create new PC component
async function create(params, userId) {
    if (!params.pcId) throw 'PC ID is required';
    if (!params.itemId) throw 'Item ID is required';
    if (!params.quantity) throw 'Quantity is required';
    if (!params.price) throw 'Price is required';
    if (!userId) throw 'User ID is required';

    // Calculate total price
    const totalPrice = params.quantity * params.price;

    // Check if we have enough stock available
    const availableStock = await getAvailableStockForItem(params.itemId);
    if (availableStock < params.quantity) {
        throw `Insufficient stock. Available: ${availableStock}, Requested: ${params.quantity}`;
    }

    // Start transaction
    const transaction = await db.sequelize.transaction();

    try {
        // Create the PC component
        const componentData = {
            ...params,
            totalPrice: totalPrice,
            createdBy: userId
        };

        const component = await db.PCComponent.create(componentData, { transaction });

        // Reduce stock quantities
        await reduceStockQuantities(params.itemId, params.quantity, transaction);

        await transaction.commit();
        
        return component;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

// Update PC component
async function update(id, params) {
    const component = await getPCComponent(id);

    // Update fields
    Object.assign(component, params);
    await component.save();
    
    return component;
}

// Delete PC component
async function _delete(id) {
    const component = await getPCComponent(id);
    
    // Start transaction
    const transaction = await db.sequelize.transaction();

    try {
        // Restore stock quantities
        await restoreStockQuantities(component.itemId, component.quantity, transaction);
        
        // Delete the component
        await component.destroy({ transaction });
        
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

// Return PC component to stock
async function returnToStock(id) {
    const component = await getPCComponent(id);
    
    // Start transaction
    const transaction = await db.sequelize.transaction();

    try {
        // Restore stock quantities
        await restoreStockQuantities(component.itemId, component.quantity, transaction);
        
        // Delete the component (same as delete, but with different name for clarity)
        await component.destroy({ transaction });
        
        await transaction.commit();
        
        return { message: `Component returned to stock successfully. ${component.quantity} units added back to global stock.` };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

// Helper function to get PC component
async function getPCComponent(id) {
    const component = await db.PCComponent.findByPk(id, {
        include: [
            { model: db.PC, as: 'pc', attributes: ['id', 'name'] },
            { model: db.Item, as: 'item', attributes: ['id', 'name'] },
            { model: db.Stock, as: 'stock', attributes: ['id', 'quantity', 'price'] }
        ]
    });
    
    if (!component) throw 'PC Component not found';
    return component;
}

// Helper function to get available stock for an item
async function getAvailableStockForItem(itemId) {
    // Get all stock entries for this item
    const stockEntries = await db.Stock.findAll({
        where: { itemId },
        order: [['createdAt', 'ASC']]
    });

    // Calculate total available stock (sum of all positive quantities)
    let availableStock = 0;
    stockEntries.forEach(entry => {
        if (entry.quantity > 0) {
            availableStock += entry.quantity;
        }
    });

    return availableStock;
}

// Helper function to reduce stock quantities
async function reduceStockQuantities(itemId, quantityToReduce, transaction) {
    // Check available stock first
    const availableStock = await getAvailableStockForItem(itemId);
    if (availableStock < quantityToReduce) {
        throw `Insufficient stock. Available: ${availableStock}, Requested: ${quantityToReduce}`;
    }

    // Find existing stock entries with positive quantities (additions)
    const stockEntries = await db.Stock.findAll({
        where: { 
            itemId: itemId,
            disposeId: null // Only addition entries
        },
        order: [['createdAt', 'ASC']] // Oldest first
    });

    let remainingQuantity = quantityToReduce;
    
    // Update existing stock entries, reducing from oldest first
    for (const stock of stockEntries) {
        if (remainingQuantity <= 0) break;
        
        if (stock.quantity > 0) {
            const quantityToDeduct = Math.min(stock.quantity, remainingQuantity);
            stock.quantity -= quantityToDeduct;
            remainingQuantity -= quantityToDeduct;
            
            // Update the stock entry
            await stock.save({ transaction });
            console.log(`Reduced stock entry ${stock.id} by ${quantityToDeduct}, new quantity: ${stock.quantity}`);
        }
    }
    
    if (remainingQuantity > 0) {
        throw `Insufficient stock. Could only reduce ${quantityToReduce - remainingQuantity} out of ${quantityToReduce} requested`;
    }
    
    console.log(`Stock reduced for item ${itemId}: ${quantityToReduce} units`);
}

// Helper function to restore stock quantities when component is deleted
async function restoreStockQuantities(itemId, quantityToRestore, transaction) {
    // Find existing stock entries with positive quantities (additions)
    const stockEntries = await db.Stock.findAll({
        where: { 
            itemId: itemId,
            disposeId: null // Only addition entries
        },
        order: [['createdAt', 'ASC']] // Oldest first
    });

    let remainingQuantity = quantityToRestore;
    
    // Update existing stock entries, restoring to oldest first
    for (const stock of stockEntries) {
        if (remainingQuantity <= 0) break;
        
        // Restore to this stock entry
        stock.quantity += remainingQuantity;
        remainingQuantity = 0;
        
        // Update the stock entry
        await stock.save({ transaction });
        console.log(`Restored stock entry ${stock.id} by ${quantityToRestore}, new quantity: ${stock.quantity}`);
    }
    
    // If no existing stock entries found, create a new one
    if (stockEntries.length === 0) {
        const stockData = {
            itemId: itemId,
            quantity: quantityToRestore,
            price: 0,
            totalPrice: 0,
            locationId: 1,
            remarks: `PC Component Removal - Quantity restored by ${quantityToRestore}`,
            createdBy: 1
        };
        await db.Stock.create(stockData, { transaction });
        console.log(`Created new stock entry for restoration: ${quantityToRestore} units`);
    }
    
    console.log(`Stock restored for item ${itemId}: ${quantityToRestore} units`);
} 