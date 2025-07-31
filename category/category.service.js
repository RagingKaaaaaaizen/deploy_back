const db = require('../_helpers/db');

module.exports = {
    getAll,
    getById,
    create,
    update,
    delete: _delete
};

async function getAll() {
    return await db.Category.findAll();
}

async function getById(id) {
    return await getCategory(id);
}

async function create(params) {
    if (await db.Category.findOne({ where: { name: params.name } })) {
        throw `Category "${params.name}" already exists`;
    }
    const category = await db.Category.create(params);
    return category;
}

async function update(id, params) {
    const category = await getCategory(id);

    // Prevent duplicate name
    if (params.name && params.name !== category.name &&
        await db.Category.findOne({ where: { name: params.name } })) {
        throw `Category "${params.name}" already exists`;
    }

    Object.assign(category, params);
    await category.save();
    return category;
}

async function _delete(id) {
    const category = await getCategory(id);
    await category.destroy();
}

// Helper
async function getCategory(id) {
    const category = await db.Category.findByPk(id);
    if (!category) throw 'Category not found';
    return category;
}
