const db = require('../_helpers/db');

module.exports = {
    getAll,
    getById,
    create,
    update,
    delete: _delete
};

// Get all storage locations
async function getAll() {
    return await db.StorageLocation.findAll();
}

// Get single storage location
async function getById(id) {
    return await getLocation(id);
}

// Create new storage location
async function create(params) {
    return await db.StorageLocation.create(params);
}

// Update storage location
async function update(id, params) {
    const location = await getLocation(id);
    Object.assign(location, params);
    await location.save();
    return location;
}

// Delete storage location
async function _delete(id) {
    const location = await getLocation(id);
    await location.destroy();
}

// Helper
async function getLocation(id) {
    const location = await db.StorageLocation.findByPk(id);
    if (!location) throw 'Storage location not found';
    return location;
}
