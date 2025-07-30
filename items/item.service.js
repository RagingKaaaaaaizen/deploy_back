const db = require('../_helpers/db');

module.exports = {
    getAll,
    getById,
    create,
    update,
    delete: _delete
};

async function getAll() {
    return await db.Item.findAll({ include: [{ model: db.ItemCategory, as: 'category' }] });
}

async function getById(id) {
    return await getItem(id);
}

async function create(params) {
    if (!params.categoryId) throw 'Category is required';

    const item = await db.Item.create(params);
    return item;
}

async function update(id, params) {
    const item = await getItem(id);
    Object.assign(item, params);
    await item.save();
    return item;
}
async function create(params) {
    if (!params.categoryId) throw 'Category is required';
    return await db.Item.create(params);
}

async function _delete(id) {
    const item = await getItem(id);
    await item.destroy();
}

// Helper
async function getItem(id) {
    const item = await db.Item.findByPk(id, { include: [{ model: db.ItemCategory, as: 'category' }] });
    if (!item) throw 'Item not found';
    return item;
}
