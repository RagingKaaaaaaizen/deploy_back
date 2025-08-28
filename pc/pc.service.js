const db = require('../_helpers/db');

module.exports = {
    getAll,
    getById,
    create,
    update,
    delete: _delete,
    getSpecificationFields
};

// Get all PCs with room location
async function getAll() {
    return await db.PC.scope('withAssociations').findAll({
        order: [['createdAt', 'DESC']]
    });
}

// Get single PC by ID
async function getById(id) {
    return await getPC(id);
}

// Create new PC
async function create(params, userId) {
    // Validate room location exists
    const roomLocation = await db.RoomLocation.findByPk(params.roomLocationId);
    if (!roomLocation) throw 'Room location not found';

    // Check for duplicate serial number if provided
    if (params.serialNumber) {
        const existing = await db.PC.findOne({ where: { serialNumber: params.serialNumber } });
        if (existing) throw 'PC with this serial number already exists';
    }

    const pc = await db.PC.create({
        ...params,
        createdBy: userId
    });

    return await getPC(pc.id);
}

// Update PC
async function update(id, params) {
    const pc = await getPC(id);

    // Validate room location if being updated
    if (params.roomLocationId) {
        const roomLocation = await db.RoomLocation.findByPk(params.roomLocationId);
        if (!roomLocation) throw 'Room location not found';
    }

    // Check for duplicate serial number if being updated
    if (params.serialNumber && params.serialNumber !== pc.serialNumber) {
        const existing = await db.PC.findOne({ where: { serialNumber: params.serialNumber } });
        if (existing) throw 'PC with this serial number already exists';
    }

    Object.assign(pc, params);
    await pc.save();

    return await getPC(pc.id);
}

// Delete PC
async function _delete(id) {
    const pc = await getPC(id);
    await pc.destroy();
}

// Get specification fields based on category (kept for compatibility)
async function getSpecificationFields(categoryId) {
    const category = await db.Category.findByPk(categoryId);
    if (!category) throw 'Category not found';

    // Get specification fields from the database
    const specFields = await db.SpecificationField.findAll({
        where: { categoryId },
        order: [['fieldOrder', 'ASC']]
    });

    // If no fields defined, return default
    if (specFields.length === 0) {
        return [
            { name: 'specifications', label: 'Specifications', type: 'textarea' }
        ];
    }

    return specFields.map(field => ({
        name: field.fieldName,
        label: field.fieldLabel,
        type: field.fieldType,
        required: field.isRequired,
        options: field.options ? field.options.split(',').map(opt => opt.trim()) : null
    }));
}

// Helper function
async function getPC(id) {
    const pc = await db.PC.scope('withAssociations').findByPk(id);
    if (!pc) throw 'PC not found';
    return pc;
} 