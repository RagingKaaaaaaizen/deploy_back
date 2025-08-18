const db = require('../_helpers/db');
const activityLogService = require('../activity-log/activity-log.service');

module.exports = {
    getAll,
    getById,
    create,
    update,
    delete: _delete
};

// Get all items (include category + brand)
async function getAll() {
    return await db.Item.findAll({
        include: [
            { model: db.Category, as: 'category', attributes: ['id', 'name'] },
            { model: db.Brand, as: 'brand', attributes: ['id', 'name'] }
        ]
    });
}

// Get single item by ID (include category + brand)
async function getById(id) {
    return await getItem(id);
}

// Create new item


async function create(params) {
    if (!params.categoryId) throw 'Category is required';

    if (params.brandName && !params.brandId) {
        const brand = await db.Brand.findOne({ where: { name: params.brandName } });
        if (!brand) throw 'Brand not found';
        params.brandId = brand.id;
    }

    if (!params.brandId) throw 'Brand is required';

    const item = await db.Item.create(params);
    
    // Log activity if user ID is provided
    if (params.createdBy) {
        try {
            await activityLogService.logActivity({
                userId: params.createdBy,
                action: 'CREATE_ITEM',
                entityType: 'ITEM',
                entityId: item.id,
                entityName: item.name,
                details: { itemData: params }
            });
        } catch (error) {
            console.error('Failed to log item creation activity:', error);
        }
    }
    
    return item;
}
// Update item
async function update(id, params) {
    const item = await getItem(id);
    const oldData = { ...item.toJSON() };
    
    Object.assign(item, params);
    await item.save();
    
    // Log activity if user ID is provided
    if (params.updatedBy || params.createdBy) {
        try {
            await activityLogService.logActivity({
                userId: params.updatedBy || params.createdBy,
                action: 'UPDATE_ITEM',
                entityType: 'ITEM',
                entityId: item.id,
                entityName: item.name,
                details: { 
                    oldData: oldData,
                    newData: params 
                }
            });
        } catch (error) {
            console.error('Failed to log item update activity:', error);
        }
    }
    
    return item;
}

// Delete item
async function _delete(id, userId = null) {
    const item = await getItem(id);
    
    // Log activity before deletion if user ID is provided
    if (userId) {
        try {
            await activityLogService.logActivity({
                userId: userId,
                action: 'DELETE_ITEM',
                entityType: 'ITEM',
                entityId: item.id,
                entityName: item.name,
                details: { deletedItem: item.toJSON() }
            });
        } catch (error) {
            console.error('Failed to log item deletion activity:', error);
        }
    }
    
    await item.destroy();
}

// Helper: get item by ID
async function getItem(id) {
    const item = await db.Item.findByPk(id, {
        include: [
            { model: db.Brand, as: 'brand', attributes: ['id', 'name'] },
            { model: db.Category, as: 'category', attributes: ['id', 'name'] }
        ]
    });
    if (!item) throw 'Item not found';
    return item;
}
