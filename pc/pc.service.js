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
    try {
        console.log('🔍 PC Service - getAll called');
        console.log('🔍 PC Service - db.PC available:', !!db.PC);
        
        const pcs = await db.PC.scope('withAssociations').findAll({
            order: [['createdAt', 'DESC']]
        });
        
        console.log('✅ PC Service - getAll successful, found', pcs.length, 'PCs');
        console.log('🔍 PC Service - PCs data:', pcs.map(pc => ({ id: pc.id, name: pc.name, roomLocationId: pc.roomLocationId })));
        
        return pcs;
    } catch (error) {
        console.error('❌ PC Service - Error in getAll function:', error);
        console.error('❌ PC Service - Error stack:', error.stack);
        throw error;
    }
}

// Get single PC by ID
async function getById(id) {
    return await getPC(id);
}

// Create new PC
async function create(params, userId) {
    try {
        console.log('🔍 PC Service - create called with params:', params);
        console.log('🔍 PC Service - params types:', {
            roomLocationId: typeof params.roomLocationId,
            name: typeof params.name,
            status: typeof params.status
        });
        console.log('🔍 PC Service - userId:', userId);
        
        // Validate room location exists
        console.log('🔍 PC Service - Checking room location with ID:', params.roomLocationId);
        
        // First, get all locations to see what's in the database
        const allLocations = await db.RoomLocation.findAll({ raw: true });
        console.log('🔍 PC Service - ALL room locations in database:', allLocations);
        
        // Try to query with detailed logging - use reload: true to bypass cache
        const roomLocation = await db.RoomLocation.findOne({
            where: { id: params.roomLocationId },
            rejectOnEmpty: false
        });
        console.log('🔍 PC Service - Room location query result:', roomLocation ? {
            id: roomLocation.id,
            name: roomLocation.name,
            dataValues: roomLocation.dataValues
        } : null);
        
        if (!roomLocation) {
            console.error('❌ PC Service - Room location not found for ID:', params.roomLocationId);
            console.error('❌ PC Service - Total room locations in database:', allLocations.length);
            console.error('❌ PC Service - Available room locations:', allLocations.map(loc => ({ 
                id: loc.id, 
                idType: typeof loc.id,
                name: loc.name 
            })));
            
            // Check table names
            console.error('❌ PC Service - RoomLocation table name:', db.RoomLocation.getTableName());
            console.error('❌ PC Service - PC table name:', db.PC.getTableName());
            
            // Try a raw SQL query to double-check
            try {
                const [rawResults] = await db.sequelize.query(
                    'SELECT * FROM roomLocations WHERE id = ?',
                    { replacements: [params.roomLocationId] }
                );
                console.error('❌ PC Service - Raw SQL query result:', rawResults);
            } catch (sqlError) {
                console.error('❌ PC Service - Raw SQL query failed:', sqlError.message);
            }
            
            throw new Error(`Room location with ID ${params.roomLocationId} does not exist. Please refresh the page and select a valid room location.`);
        }

        // Check for duplicate serial number if provided
        if (params.serialNumber) {
            console.log('🔍 PC Service - Checking for duplicate serial number:', params.serialNumber);
            const existing = await db.PC.findOne({ where: { serialNumber: params.serialNumber } });
            if (existing) {
                console.error('❌ PC Service - PC with serial number already exists:', params.serialNumber);
                throw new Error('PC with this serial number already exists');
            }
        }

        console.log('🔍 PC Service - Creating PC with data:', { ...params, createdBy: userId });
        const pc = await db.PC.create({
            ...params,
            createdBy: userId
        });
        console.log('✅ PC Service - PC created successfully with ID:', pc.id);

        const result = await getPC(pc.id);
        console.log('✅ PC Service - Returning PC with associations:', result);
        return result;
    } catch (error) {
        console.error('❌ PC Service - Error in create function:', error);
        console.error('❌ PC Service - Error name:', error.name);
        console.error('❌ PC Service - Error message:', error.message);
        console.error('❌ PC Service - Error stack:', error.stack);
        
        // If it's a Sequelize validation error
        if (error.name === 'SequelizeValidationError') {
            const validationErrors = error.errors.map(e => `${e.path}: ${e.message}`).join(', ');
            console.error('❌ PC Service - Validation errors:', validationErrors);
            throw new Error(`Validation error: ${validationErrors}`);
        }
        
        // If it's a Sequelize unique constraint error (duplicate serial number)
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error.errors[0]?.path || 'field';
            console.error('❌ PC Service - Unique constraint violated on:', field);
            if (field === 'serialNumber') {
                throw new Error('A PC with this serial number already exists. Please use a unique serial number or leave it empty.');
            }
            throw new Error(`Duplicate ${field}. Please use a unique value.`);
        }
        
        // If it's a Sequelize foreign key error, provide a better message
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            throw new Error(`Invalid room location. The selected location may have been deleted. Please refresh the page and select a valid location.`);
        }
        
        throw error;
    }
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
    try {
        console.log('🔍 PC Service - getPC called with ID:', id);
        console.log('🔍 PC Service - db.PC available:', !!db.PC);
        
        const pc = await db.PC.scope('withAssociations').findByPk(id);
        console.log('🔍 PC Service - PC found:', pc ? { id: pc.id, name: pc.name } : 'null');
        
        if (!pc) {
            console.error('❌ PC Service - PC not found with ID:', id);
            throw 'PC not found';
        }
        
        console.log('✅ PC Service - getPC successful for ID:', id);
        return pc;
    } catch (error) {
        console.error('❌ PC Service - Error in getPC function:', error);
        console.error('❌ PC Service - Error stack:', error.stack);
        throw error;
    }
} 