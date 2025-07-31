const db = require('../_helpers/db');

module.exports = {
    getAll,
    getById,
    create,
    update,
    delete: _delete
};

async function getAll() {
    return await db.Brand.findAll();
}

async function getById(id) {
    const brand = await db.Brand.findByPk(id);
    if (!brand) throw 'Brand not found';
    return brand;
}

async function create(params) {
    // check duplicate name
    const exists = await db.Brand.findOne({ where: { name: params.name } });
    if (exists) throw `Brand "${params.name}" already exists`;

    return await db.Brand.create(params);
}

async function update(id, params) {
    const brand = await getById(id);

    // prevent duplicate name
    if (params.name && params.name !== brand.name) {
        const exists = await db.Brand.findOne({ where: { name: params.name } });
        if (exists) throw `Brand "${params.name}" already exists`;
    }

    Object.assign(brand, params);
    await brand.save();

    return brand;
}

async function _delete(id) {
    const brand = await getById(id);
    await brand.destroy();
}
