const db = require('../_helpers/db');

module.exports = {
    getAll,
    getById,
    create,
    update,
    delete: _delete
};

// Get all items (include category + brand)
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

    return await db.Item.create(params);
}
// Update item
async function update(id, params) {
    const item = await getItem(id);
    Object.assign(item, params);
    await item.save();
    return item;
}

// Delete item
async function _delete(id) {
    const item = await getItem(id);
    await item.destroy();
}

// Helper: get item by ID
async function getItem(id) {
    const item = await db.Item.findByPk(id, {
        include: [
            { model: db.Brand, as: 'brand', attributes: ['id', 'name'] },
            { model: db.ItemCategory, as: 'category', attributes: ['id', 'name'] }
        ]
    });
    if (!item) throw 'Item not found';
    return item;
}
