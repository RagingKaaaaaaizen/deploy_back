const db = require('../_helpers/db');
const ItemCategory = db.ItemCategory;

module.exports = {
    getAll,
    getById,
    create,
    update,
    _delete
};

async function getAll() {
    return await ItemCategory.findAll();
}

async function getById(id) {
    return await ItemCategory.findByPk(id);
}

async function create(params) {
    const itemCategory = new ItemCategory(params);
    await itemCategory.save();
    return itemCategory;
}

async function update(id, params) {
    const itemCategory = await getById(id);

    // validate
    if (!itemCategory) throw 'Item category not found';
    if (itemCategory.name !== params.name && await ItemCategory.findOne({ where: { name: params.name } })) {
        throw 'Name "' + params.name + '" is already taken';
    }

    Object.assign(itemCategory, params);
    await itemCategory.save();

    return itemCategory;
}

async function _delete(id) {
    const itemCategory = await getById(id);
    if (!itemCategory) throw 'Item category not found';

    await itemCategory.destroy();
}
