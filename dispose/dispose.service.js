const db = require('../_helpers/db');
const activityLogService = require('../activity-log/activity-log.service');

module.exports = {
    getAll,
    getById,
    create,
    update,
    delete: _delete,
    getDisposalsByItem,
    validateDisposal,
    getDisposalWithStock,
    getStockWithDisposal,
    returnToStock,
    returnToStockPartial
};

// Get all disposal records with complete information
async function getAll() {
    return await db.Dispose.findAll({
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
        ],
        order: [['createdAt', 'DESC']]
    });
}

// Get single disposal record with complete information
async function getById(id) {
    return await db.Dispose.findByPk(id, {
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

// Create new disposal record
async function create(params, userId) {
    console.log('=== CREATE DISPOSAL SERVICE ===');
    console.log('Parameters:', params);
    console.log('User ID:', userId);
    
    try {
        // Basic validation
        if (!params.stockEntryId) throw 'Stock entry is required';
        if (!params.quantity) throw 'Quantity is required';
        if (!params.locationId) throw 'Location is required';
        if (!userId) throw 'User ID is required';

        // Get the stock entry to get item information
        const stockEntry = await db.Stock.findByPk(params.stockEntryId, {
            include: [
                { 
                    model: db.Item, 
                    as: 'item', 
                    attributes: ['id', 'name', 'description'],
                    include: [
                        { model: db.Category, as: 'category', attributes: ['name'] },
                        { model: db.Brand, as: 'brand', attributes: ['name'] }
                    ]
                },
                { model: db.StorageLocation, as: 'location', attributes: ['id', 'name'] }
            ]
        });

        if (!stockEntry) {
            throw 'Stock entry not found';
        }

        console.log('Stock entry found:', {
            id: stockEntry.id,
            itemId: stockEntry.itemId,
            quantity: stockEntry.quantity,
            price: stockEntry.price,
            item: stockEntry.item ? {
                id: stockEntry.item.id,
                name: stockEntry.item.name
            } : 'No item data'
        });

        // Check if this stock entry has already been fully disposed
        if (stockEntry.quantity <= 0) {
            throw 'This stock entry has no available quantity for disposal';
        }

        if (params.quantity > stockEntry.quantity) {
            throw `Cannot dispose ${params.quantity} units. Only ${stockEntry.quantity} units available in this stock entry`;
        }

        // Calculate total value (using stock entry price)
        const disposalValue = stockEntry.price || 0;
        const totalValue = params.quantity * disposalValue;
        console.log('Calculated total value:', totalValue);

        const disposalData = {
            itemId: Number(stockEntry.itemId), // Ensure itemId is a number
            quantity: Number(params.quantity), // Ensure quantity is a number
            totalValue: Number(totalValue), // Ensure totalValue is a number
            locationId: Number(params.locationId), // Ensure locationId is a number
            reason: params.reason || '',
            disposalDate: new Date(),
            createdBy: Number(userId) // Ensure userId is a number
        };

        // Add all required columns
        disposalData.disposalValue = Number(disposalValue);
        disposalData.sourceStockId = Number(params.stockEntryId);

        console.log('Creating disposal with data:', disposalData);
        console.log('Stock entry itemId:', stockEntry.itemId);
        console.log('Disposal data itemId:', disposalData.itemId);

        let disposal;
        try {
            disposal = await db.Dispose.create(disposalData);
            console.log('Disposal record created successfully:', disposal.id);
        } catch (createError) {
            console.error('Error creating disposal record:', createError);
            console.error('Error details:', createError.errors);
            if (createError.errors) {
                createError.errors.forEach(error => {
                    console.error(`Validation error for ${error.path}: ${error.message}`);
                });
            }
            throw createError;
        }
        
        // Update the stock entry quantity
        stockEntry.quantity -= params.quantity;
        stockEntry.totalPrice = stockEntry.quantity * stockEntry.price;
        
        // Only mark the stock entry with disposeId if it's fully disposed (quantity = 0)
        // This allows partial disposals of the same stock entry
        if (stockEntry.quantity <= 0) {
            stockEntry.disposeId = disposal.id;
        }
        
        await stockEntry.save();
        console.log('Stock entry updated successfully');

        // Log activity after successful disposal creation
        try {
            const user = await db.Account.findByPk(userId);
            const location = await db.StorageLocation.findByPk(params.locationId);
            
            await activityLogService.logActivity({
                userId: userId,
                action: 'DISPOSE_ITEM',
                entityType: 'DISPOSE',
                entityId: disposal.id,
                entityName: `Disposed ${params.quantity} units of ${stockEntry.item.name} (${stockEntry.item.brand.name} - ${stockEntry.item.category.name}) from ${location.name}`,
                details: { 
                    itemId: stockEntry.itemId,
                    itemName: stockEntry.item.name,
                    categoryName: stockEntry.item.category.name,
                    brandName: stockEntry.item.brand.name,
                    stockEntryId: params.stockEntryId,
                    locationId: params.locationId,
                    locationName: location.name,
                    quantity: params.quantity,
                    disposalValue: disposalValue,
                    totalValue: totalValue,
                    reason: params.reason || 'No reason provided',
                    createdBy: user ? `${user.firstName} ${user.lastName}` : 'Unknown User'
                }
            });
        } catch (error) {
            console.error('Failed to log disposal creation activity:', error);
        }
        
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

    // Calculate available stock (sum of all positive quantities)
    let totalStock = 0;
    stockEntries.forEach(entry => {
        if (entry.quantity > 0) {
            totalStock += entry.quantity;
            console.log('Adding stock:', entry.quantity, 'New total:', totalStock);
        }
    });

    // Get PC components usage for this item
    const pcComponents = await db.PCComponent.findAll({
        where: { itemId }
    });
    
    const usedInPCComponents = pcComponents.reduce((total, component) => {
        return total + component.quantity;
    }, 0);
    
    console.log('PC components using this item:', pcComponents.length);
    console.log('Total quantity used in PC components:', usedInPCComponents);

    // Calculate available stock (total stock - used in PC components)
    const availableStock = Math.max(0, totalStock - usedInPCComponents);
    console.log('Total stock:', totalStock, 'Used in PCs:', usedInPCComponents, 'Available:', availableStock);

    // If quantity is 0, just return available stock info
    if (quantity === 0) {
        console.log('Quantity is 0, returning available stock info');
        return {
            valid: true,
            availableStock: availableStock,
            totalStock: totalStock,
            usedInPCComponents: usedInPCComponents
        };
    }

    if (quantity > availableStock) {
        console.log('Validation failed: quantity > availableStock');
        return {
            valid: false,
            message: `Cannot dispose ${quantity} items. Only ${availableStock} items available (${totalStock} total stock - ${usedInPCComponents} used in PC components).`
        };
    }

    console.log('Validation successful');
    return {
        valid: true,
        availableStock: availableStock,
        totalStock: totalStock,
        usedInPCComponents: usedInPCComponents
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

// Return disposed items back to stock
async function returnToStock(disposalId, userId) {
    console.log('=== RETURN TO STOCK SERVICE ===');
    console.log('DisposalId:', disposalId, 'UserId:', userId);
    
    try {
        // Validate inputs
        if (!disposalId || !userId) {
            throw 'Disposal ID and User ID are required';
        }

        // Get the disposal record
        const disposal = await getDisposal(disposalId);
        
        if (!disposal) {
            throw 'Disposal record not found';
        }
        
        // Check if items have already been returned
        if (disposal.returnedToStock) {
            throw 'Items have already been returned to stock';
        }

        // Validate disposal data
        if (!disposal.itemId || !disposal.quantity || !disposal.locationId) {
            throw 'Invalid disposal record: missing required fields';
        }
        
        // Use transaction for data integrity
        const result = await db.sequelize.transaction(async (t) => {
            // Find existing stock entries for this item and location
            const existingStockEntries = await db.Stock.findAll({
                where: { 
                    itemId: parseInt(disposal.itemId),
                    locationId: parseInt(disposal.locationId),
                    disposeId: null // Only addition entries (not disposal entries)
                },
                order: [['createdAt', 'ASC']] // Oldest first
            });
            
            let stockEntry;
            
            if (existingStockEntries.length > 0) {
                // Add to the most recent existing stock entry
                stockEntry = existingStockEntries[existingStockEntries.length - 1];
                stockEntry.quantity += parseInt(disposal.quantity);
                stockEntry.totalPrice = stockEntry.quantity * stockEntry.price;
                stockEntry.remarks = stockEntry.remarks ? 
                    `${stockEntry.remarks}; Returned ${disposal.quantity} from disposal ID: ${disposalId}` :
                    `Returned ${disposal.quantity} from disposal ID: ${disposalId}. Original disposal reason: ${disposal.reason || 'No reason provided'}`;
                
                await stockEntry.save({ transaction: t });
                console.log('Added to existing stock entry:', stockEntry.id, 'New quantity:', stockEntry.quantity);
            } else {
                // Create a new stock entry if no existing stock found
                const stockData = {
                    itemId: parseInt(disposal.itemId),
                    quantity: parseInt(disposal.quantity),
                    price: parseFloat(disposal.disposalValue), // Use the disposal value as the return price
                    totalPrice: parseFloat(disposal.quantity * disposal.disposalValue),
                    locationId: parseInt(disposal.locationId),
                    disposeId: parseInt(disposalId), // Link back to the disposal record
                    remarks: `Returned from disposal ID: ${disposalId}. Original disposal reason: ${disposal.reason || 'No reason provided'}`,
                    createdBy: parseInt(userId)
                };
                
                stockEntry = await db.Stock.create(stockData, { transaction: t });
                console.log('Created new stock entry for return:', stockEntry.id);
            }
            
            // Mark the disposal as returned to stock
            disposal.returnedToStock = true;
            disposal.returnedAt = new Date();
            disposal.returnedBy = parseInt(userId);
            disposal.returnStockId = parseInt(stockEntry.id);
            
            await disposal.save({ transaction: t });
            console.log('Disposal record updated as returned');
            
            return stockEntry;
        });
        
        const stockEntry = result;
        
        // Log activity
        try {
            const item = await db.Item.findByPk(disposal.itemId);
            await activityLogService.logActivity({
                userId: userId,
                action: 'RETURN_TO_STOCK',
                entityType: 'DISPOSE',
                entityId: disposal.id,
                entityName: `Returned ${disposal.quantity} units of ${item.name} to stock`,
                details: { 
                    disposalId: disposal.id,
                    itemId: disposal.itemId,
                    quantity: disposal.quantity,
                    returnPrice: disposal.disposalValue,
                    stockEntryId: stockEntry.id,
                    addedToExisting: existingStockEntries.length > 0
                }
            });
        } catch (error) {
            console.error('Failed to log return to stock activity:', error);
        }
        
        return {
            success: true,
            message: `Successfully returned ${disposal.quantity} items to stock`,
            stockEntry: stockEntry,
            disposal: disposal,
            addedToExisting: existingStockEntries.length > 0
        };
        
    } catch (error) {
        console.error('Error in return to stock:', error);
        throw error;
    }
}

// Return partial disposed items back to stock
async function returnToStockPartial(disposalId, quantity, remarks, userId) {
    console.log('=== PARTIAL RETURN TO STOCK SERVICE ===');
    console.log('DisposalId:', disposalId, 'Quantity:', quantity, 'Remarks:', remarks, 'UserId:', userId);
    
    try {
        // Validate inputs
        if (!disposalId || !quantity || !userId) {
            throw 'Disposal ID, quantity, and User ID are required';
        }

        // Ensure quantity is a number
        const numericQuantity = parseInt(quantity);
        if (numericQuantity <= 0) {
            throw 'Quantity must be greater than 0';
        }

        // Get the disposal record
        const disposal = await getDisposal(disposalId);
        
        if (!disposal) {
            throw 'Disposal record not found';
        }
        
        // Check if items have already been returned
        if (disposal.returnedToStock) {
            throw 'Items have already been returned to stock';
        }

        // Validate quantity
        if (numericQuantity > disposal.quantity) {
            throw `Cannot return ${numericQuantity} items. Only ${disposal.quantity} items available for return`;
        }

        // Validate disposal data
        if (!disposal.itemId || !disposal.locationId) {
            throw 'Invalid disposal record: missing required fields';
        }
        
        // Use transaction for data integrity
        const result = await db.sequelize.transaction(async (t) => {
            // Find existing stock entries for this item and location
            const existingStockEntries = await db.Stock.findAll({
                where: { 
                    itemId: parseInt(disposal.itemId),
                    locationId: parseInt(disposal.locationId),
                    disposeId: null // Only addition entries (not disposal entries)
                },
                order: [['createdAt', 'ASC']] // Oldest first
            });
            
            let stockEntry;
            let addedToExisting = false;
            
            // Find the original stock entry where this disposal came from
            let originalStockEntry = null;
            
            if (disposal.sourceStockId) {
                // Try to find the exact stock entry this disposal came from
                originalStockEntry = await db.Stock.findByPk(disposal.sourceStockId, { transaction: t });
                console.log('Found source stock entry:', originalStockEntry ? originalStockEntry.id : 'not found');
            }
            
            if (!originalStockEntry) {
                // Fallback: find any original stock entry for this item and location
                originalStockEntry = await db.Stock.findOne({
                    where: { 
                        itemId: parseInt(disposal.itemId),
                        locationId: parseInt(disposal.locationId),
                        disposeId: null // Only original stock entries (not disposal returns)
                    },
                    order: [['createdAt', 'DESC']], // Get the most recent original stock
                    transaction: t
                });
                console.log('Fallback: found original stock entry:', originalStockEntry ? originalStockEntry.id : 'not found');
            }

            if (originalStockEntry) {
                // Add back to the original stock entry
                originalStockEntry.quantity += numericQuantity;
                originalStockEntry.totalPrice = originalStockEntry.quantity * originalStockEntry.price;
                
                // Update remarks to show the return
                const returnRemark = `Returned ${numericQuantity} from disposal${remarks ? ` - ${remarks}` : ''}`;
                originalStockEntry.remarks = originalStockEntry.remarks ? 
                    `${originalStockEntry.remarks}; ${returnRemark}` : 
                    returnRemark;
                
                await originalStockEntry.save({ transaction: t });
                stockEntry = originalStockEntry;
                addedToExisting = true;
                console.log('Added back to original stock entry:', originalStockEntry.id, 'New quantity:', originalStockEntry.quantity);
            } else {
                // If no original stock found, create a new one
                const disposalValue = parseFloat(disposal.disposalValue);
                const stockData = {
                    itemId: parseInt(disposal.itemId),
                    quantity: numericQuantity,
                    price: disposalValue,
                    totalPrice: numericQuantity * disposalValue,
                    locationId: parseInt(disposal.locationId),
                    disposeId: null,
                    remarks: remarks || '',
                    createdBy: parseInt(userId)
                };
                
                stockEntry = await db.Stock.create(stockData, { transaction: t });
                addedToExisting = false;
                console.log('Created new stock entry (no original found):', stockEntry.id);
            }
            
            // Update disposal record
            const remainingQuantity = disposal.quantity - numericQuantity;
            
            if (remainingQuantity === 0) {
                // All items returned, mark as returned and set quantity to 0
                disposal.returnedToStock = true;
                disposal.returnedAt = new Date();
                disposal.returnedBy = parseInt(userId);
                disposal.returnStockId = parseInt(stockEntry.id);
                disposal.quantity = 0; // Set quantity to 0
                disposal.totalValue = 0; // Set total value to 0
                
                await disposal.save({ transaction: t });
                console.log('All items returned, disposal record marked as returned with quantity 0');
            } else {
                // Partial return, update the disposal quantity
                disposal.quantity = remainingQuantity;
                disposal.totalValue = parseFloat(disposal.disposalValue) * remainingQuantity;
                
                await disposal.save({ transaction: t });
                console.log('Partial return completed, remaining quantity:', remainingQuantity);
            }
            
            return { stockEntry, disposal, remainingQuantity, addedToExisting };
        });
        
        const { stockEntry, disposal: updatedDisposal, remainingQuantity, addedToExisting } = result;
        
        // Log activity
        try {
            const item = await db.Item.findByPk(disposal.itemId);
            const action = remainingQuantity === 0 ? 'RETURN_TO_STOCK' : 'PARTIAL_RETURN_TO_STOCK';
            const message = remainingQuantity === 0 
                ? `Returned all ${numericQuantity} units of ${item.name} to stock`
                : `Returned ${numericQuantity} units of ${item.name} to stock (${remainingQuantity} remaining)`;
            
            await activityLogService.logActivity({
                userId: userId,
                action: action,
                entityType: 'DISPOSE',
                entityId: disposal.id,
                entityName: message,
                details: { 
                    disposalId: disposal.id,
                    itemId: disposal.itemId,
                    quantity: numericQuantity,
                    remainingQuantity: remainingQuantity,
                    returnPrice: disposal.disposalValue,
                    stockEntryId: stockEntry.id,
                    remarks: remarks
                }
            });
        } catch (error) {
            console.error('Failed to log partial return to stock activity:', error);
        }
        
        const message = remainingQuantity === 0 
            ? `Successfully returned all ${numericQuantity} items to stock. Disposal record removed.`
            : `Successfully returned ${numericQuantity} items to stock. ${remainingQuantity} items remaining in disposal.`;
        
        return {
            success: true,
            message: message,
            stockEntry: stockEntry,
            disposal: updatedDisposal,
            remainingQuantity: remainingQuantity,
            addedToExisting: addedToExisting
        };
        
    } catch (error) {
        console.error('Error in partial return to stock:', error);
        throw error;
    }
} 