const db = require('../_helpers/db');

module.exports = {
    getFieldsByCategory,
    getAllFields,
    createField,
    updateField,
    deleteField,
    deleteFieldsByCategory,
    getFieldById
};

// Get specification fields by category ID
async function getFieldsByCategory(categoryId) {
    return await db.SpecificationField.findAll({
        where: { categoryId },
        order: [['fieldOrder', 'ASC']],
        include: [
            { model: db.Category, as: 'category', attributes: ['id', 'name'] }
        ]
    });
}

// Get all specification fields
async function getAllFields() {
    return await db.SpecificationField.scope('withCategory').findAll({
        order: [['categoryId', 'ASC'], ['fieldOrder', 'ASC']]
    });
}

// Create new specification field
async function createField(params) {
    // Validate category exists
    const category = await db.Category.findByPk(params.categoryId);
    if (!category) throw 'Category not found';

    // Check for duplicate field name in same category
    const existing = await db.SpecificationField.findOne({
        where: { 
            categoryId: params.categoryId,
            fieldName: params.fieldName
        }
    });
    if (existing) throw 'Field name already exists for this category';

    return await db.SpecificationField.create(params);
}

// Update specification field
async function updateField(id, params) {
    const field = await getField(id);

    // Check for duplicate field name if being updated
    if (params.fieldName && params.fieldName !== field.fieldName) {
        const existing = await db.SpecificationField.findOne({
            where: { 
                categoryId: field.categoryId,
                fieldName: params.fieldName
            }
        });
        if (existing) throw 'Field name already exists for this category';
    }

    Object.assign(field, params);
    await field.save();
    return field;
}

// Delete specification field
async function deleteField(id) {
    const field = await getField(id);
    await field.destroy();
}

// Delete all fields for a category
async function deleteFieldsByCategory(categoryId) {
    return await db.SpecificationField.destroy({
        where: { categoryId }
    });
}

// Get specification field by ID
async function getFieldById(id) {
    return await db.SpecificationField.scope('withCategory').findByPk(id);
}

// Helper function
async function getField(id) {
    const field = await db.SpecificationField.findByPk(id);
    if (!field) throw 'Specification field not found';
    return field;
} 