const db = require('../_helpers/db');

module.exports = {
    getAll,
    getById,
    create,
    update,
    delete: _delete
};

// Get all room locations
async function getAll() {
    return await db.RoomLocation.findAll({
        include: [
            { model: db.PC, as: 'pcs', attributes: ['id', 'name'] }
        ]
    });
}

// Get room location by ID
async function getById(id) {
    return await getRoomLocation(id);
}

// Create new room location
async function create(params, userId) {
    if (!params.name) throw 'Name is required';
    if (!userId) throw 'User ID is required';

    const roomData = {
        ...params,
        createdBy: userId
    };

    const room = await db.RoomLocation.create(roomData);
    
    return room;
}

// Update room location
async function update(id, params) {
    const room = await getRoomLocation(id);

    // Update fields
    Object.assign(room, params);
    await room.save();
    
    return room;
}

// Delete room location
async function _delete(id) {
    const room = await getRoomLocation(id);
    await room.destroy();
}

// Helper function to get room location
async function getRoomLocation(id) {
    const room = await db.RoomLocation.findByPk(id, {
        include: [
            { model: db.PC, as: 'pcs', attributes: ['id', 'name'] }
        ]
    });
    
    if (!room) throw 'Room Location not found';
    return room;
} 