const db = require('../_helpers/db');
const activityLogService = require('../activity-log/activity-log.service');

module.exports = {
    getAll,
    getById,
    create,
    update,
    delete: _delete,
    duplicate,
    comparePC,
    comparePCs,
    applyTemplateToPC,
    getTemplateStats
};

// Get all templates
async function getAll() {
    return await db.PCBuildTemplate.findAll({
        include: [
            {
                model: db.PCBuildTemplateComponent,
                as: 'components',
                include: [
                    { model: db.Category, as: 'category' },
                    { model: db.Item, as: 'item' }
                ]
            }
        ],
        order: [['createdAt', 'DESC']]
    });
}

// Get template by ID
async function getById(id) {
    const template = await db.PCBuildTemplate.findByPk(id, {
        include: [
            {
                model: db.PCBuildTemplateComponent,
                as: 'components',
                include: [
                    { model: db.Category, as: 'category' },
                    { model: db.Item, as: 'item' }
                ]
            },
            {
                model: db.Account,
                as: 'creator',
                attributes: ['id', 'firstName', 'lastName', 'email']
            }
        ]
    });
    
    if (!template) throw 'Template not found';
    return template;
}

// Create new template
async function create(params, userId) {
    const { name, description, components } = params;

    // Validate template name is unique
    const existingTemplate = await db.PCBuildTemplate.findOne({ where: { name } });
    if (existingTemplate) {
        throw `Template with name "${name}" already exists`;
    }

    // Validate components
    if (!components || components.length === 0) {
        throw 'Template must have at least one component';
    }

    // Check for duplicate categories
    const categoryIds = components.map(c => c.categoryId);
    const uniqueCategories = [...new Set(categoryIds)];
    if (categoryIds.length !== uniqueCategories.length) {
        throw 'Cannot have multiple components from the same category';
    }

    // Use transaction for atomic operation
    const transaction = await db.sequelize.transaction();

    try {
        // Create template
        const template = await db.PCBuildTemplate.create({
            name,
            description,
            createdBy: userId
        }, { transaction });

        // Create components
        const componentPromises = components.map(comp => {
            return db.PCBuildTemplateComponent.create({
                templateId: template.id,
                categoryId: comp.categoryId,
                itemId: comp.itemId,
                quantity: comp.quantity || 1,
                remarks: comp.remarks || ''
            }, { transaction });
        });

        await Promise.all(componentPromises);

        // Commit transaction
        await transaction.commit();

        // Log activity
        await activityLogService.logActivity({
            userId: userId,
            action: 'create',
            entityType: 'PCBuildTemplate',
            entityId: template.id,
            entityName: name,
            details: `Created template: ${name}`
        });

        // Return template with components
        return await getById(template.id);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

// Update template
async function update(id, params, userId) {
    const template = await getById(id);
    const { name, description, components } = params;

    // Validate name uniqueness if changed
    if (name && name !== template.name) {
        const existingTemplate = await db.PCBuildTemplate.findOne({ where: { name } });
        if (existingTemplate) {
            throw `Template with name "${name}" already exists`;
        }
    }

    const transaction = await db.sequelize.transaction();

    try {
        // Update template metadata
        if (name) template.name = name;
        if (description !== undefined) template.description = description;
        await template.save({ transaction });

        // Update components if provided
        if (components) {
            // Delete existing components
            await db.PCBuildTemplateComponent.destroy({
                where: { templateId: id },
                transaction
            });

            // Create new components
            const componentPromises = components.map(comp => {
                return db.PCBuildTemplateComponent.create({
                    templateId: id,
                    categoryId: comp.categoryId,
                    itemId: comp.itemId,
                    quantity: comp.quantity || 1,
                    remarks: comp.remarks || ''
                }, { transaction });
            });

            await Promise.all(componentPromises);
        }

        await transaction.commit();

        // Log activity
        await activityLogService.logActivity({
            userId: userId,
            action: 'update',
            entityType: 'PCBuildTemplate',
            entityId: id,
            entityName: template.name,
            details: `Updated template: ${template.name}`
        });

        return await getById(id);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

// Delete template
async function _delete(id, userId) {
    const template = await getById(id);
    const templateName = template.name; // Save name before destroying

    // Delete all associated components first (due to foreign key constraints)
    await db.PCBuildTemplateComponent.destroy({
        where: { templateId: id }
    });

    // Now delete the template
    await template.destroy();

    // Log activity
    await activityLogService.logActivity({
        userId: userId,
        action: 'delete',
        entityType: 'PCBuildTemplate',
        entityId: id,
        entityName: templateName,
        details: `Deleted template: ${templateName}`
    });

    return { message: 'Template deleted successfully' };
}

// Duplicate template
async function duplicate(id, newName, userId) {
    const originalTemplate = await getById(id);

    // Validate new name
    const existingTemplate = await db.PCBuildTemplate.findOne({ where: { name: newName } });
    if (existingTemplate) {
        throw `Template with name "${newName}" already exists`;
    }

    const transaction = await db.sequelize.transaction();

    try {
        // Create new template
        const newTemplate = await db.PCBuildTemplate.create({
            name: newName,
            description: `Copy of: ${originalTemplate.description || originalTemplate.name}`,
            createdBy: userId
        }, { transaction });

        // Copy components
        const components = await db.PCBuildTemplateComponent.findAll({
            where: { templateId: id }
        });

        const componentPromises = components.map(comp => {
            return db.PCBuildTemplateComponent.create({
                templateId: newTemplate.id,
                categoryId: comp.categoryId,
                itemId: comp.itemId,
                quantity: comp.quantity,
                remarks: comp.remarks
            }, { transaction });
        });

        await Promise.all(componentPromises);

        await transaction.commit();

        // Log activity
        await activityLogService.logActivity({
            userId: userId,
            action: 'create',
            entityType: 'PCBuildTemplate',
            entityId: newTemplate.id,
            entityName: newName,
            details: `Duplicated template from: ${originalTemplate.name}`
        });

        return await getById(newTemplate.id);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

// Compare PC with template
async function comparePC(pcId, templateId) {
    // Get PC components
    const pcComponents = await db.PCComponent.findAll({
        where: { pcId },
        include: [
            { model: db.Item, as: 'item', include: [{ model: db.Category, as: 'category' }] }
        ]
    });

    // Get template components
    const template = await getById(templateId);
    const templateComponents = template.components;

    // Build comparison
    const mismatches = [];
    let matchCount = 0;

    for (const templateComp of templateComponents) {
        const category = templateComp.category;
        const templateItem = templateComp.item;

        // Find matching PC component in same category
        const pcComp = pcComponents.find(pc => pc.item.categoryId === templateComp.categoryId);

        if (!pcComp) {
            // Component missing
            mismatches.push({
                categoryId: category.id,
                categoryName: category.name,
                reason: 'missing',
                template: {
                    itemId: templateItem.id,
                    itemName: templateItem.name,
                    quantity: templateComp.quantity
                },
                actual: null,
                suggestedAction: 'Add component to PC'
            });
        } else if (pcComp.itemId !== templateComp.itemId) {
            // Different item
            mismatches.push({
                categoryId: category.id,
                categoryName: category.name,
                reason: 'different_item',
                template: {
                    itemId: templateItem.id,
                    itemName: templateItem.name,
                    quantity: templateComp.quantity
                },
                actual: {
                    itemId: pcComp.item.id,
                    itemName: pcComp.item.name,
                    quantity: pcComp.quantity
                },
                suggestedAction: 'Replace with template component'
            });
        } else if (pcComp.quantity !== templateComp.quantity) {
            // Different quantity
            mismatches.push({
                categoryId: category.id,
                categoryName: category.name,
                reason: 'different_quantity',
                template: {
                    itemId: templateItem.id,
                    itemName: templateItem.name,
                    quantity: templateComp.quantity
                },
                actual: {
                    itemId: pcComp.item.id,
                    itemName: pcComp.item.name,
                    quantity: pcComp.quantity
                },
                suggestedAction: 'Update quantity to match template'
            });
        } else {
            // Perfect match
            matchCount++;
        }
    }

    return {
        pcId,
        templateId,
        templateName: template.name,
        totalComponents: templateComponents.length,
        matchCount,
        mismatchCount: mismatches.length,
        matches: mismatches.length === 0,
        matchPercentage: Math.round((matchCount / templateComponents.length) * 100),
        mismatches
    };
}

// Compare multiple PCs with template
async function comparePCs(pcIds, templateId) {
    const comparisons = [];

    for (const pcId of pcIds) {
        const comparison = await comparePC(pcId, templateId);
        comparisons.push(comparison);
    }

    return comparisons;
}

// Apply template to PC
async function applyTemplateToPC(pcId, templateId, options, userId) {
    const { replaceAll = false, replaceCategories = [] } = options || {};

    // Get comparison first
    const comparison = await comparePC(pcId, templateId);

    if (comparison.matches) {
        throw 'PC already matches template';
    }

    // Get template
    const template = await getById(templateId);

    // Check stock availability for all replacements
    const stockChecks = [];
    for (const mismatch of comparison.mismatches) {
        if (mismatch.reason === 'missing' || (replaceAll || replaceCategories.includes(mismatch.categoryId))) {
            const stockCheck = await checkStockAvailability(mismatch.template.itemId, mismatch.template.quantity);
            if (!stockCheck.available) {
                throw `Insufficient stock for ${mismatch.template.itemName}. Available: ${stockCheck.availableQuantity}, Required: ${mismatch.template.quantity}`;
            }
            stockChecks.push(stockCheck);
        }
    }

    const transaction = await db.sequelize.transaction();

    try {
        const replacedComponents = [];

        for (const mismatch of comparison.mismatches) {
            const shouldReplace = replaceAll || replaceCategories.includes(mismatch.categoryId);

            if (!shouldReplace) continue;

            // If component exists, remove it first (returns to stock)
            if (mismatch.actual) {
                const existingComp = await db.PCComponent.findOne({
                    where: {
                        pcId,
                        itemId: mismatch.actual.itemId
                    }
                });

                if (existingComp) {
                    // Return to stock
                    await returnComponentToStock(existingComp.id, transaction);
                    await existingComp.destroy({ transaction });
                }
            }

            // Add new component from template
            const templateComp = template.components.find(tc => tc.categoryId === mismatch.categoryId);
            if (templateComp) {
                // Find available stock for this item
                const stock = await findAvailableStock(templateComp.itemId, templateComp.quantity);
                
                const newComponent = await db.PCComponent.create({
                    pcId,
                    itemId: templateComp.itemId,
                    stockId: stock.id,
                    quantity: templateComp.quantity,
                    price: stock.price,
                    totalPrice: stock.price * templateComp.quantity,
                    status: 'Working',
                    remarks: `Added from template: ${template.name}`
                }, { transaction });

                // Deduct from stock
                await deductFromStock(stock.id, templateComp.quantity, transaction);

                replacedComponents.push({
                    categoryName: mismatch.categoryName,
                    oldItem: mismatch.actual?.itemName || 'None',
                    newItem: mismatch.template.itemName,
                    quantity: templateComp.quantity
                });
            }
        }

        await transaction.commit();

        // Log activity
        await activityLogService.logActivity({
            userId: userId,
            action: 'apply_template',
            entityType: 'PC',
            entityId: pcId,
            entityName: `PC ${pcId}`,
            details: `Applied template "${template.name}" to PC. Replaced ${replacedComponents.length} components.`
        });

        return {
            success: true,
            replacedCount: replacedComponents.length,
            replacedComponents
        };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

// Helper: Check stock availability
async function checkStockAvailability(itemId, requiredQuantity) {
    const stocks = await db.Stock.findAll({
        where: { itemId },
        order: [['createdAt', 'DESC']]
    });

    let availableQuantity = 0;
    for (const stock of stocks) {
        if (stock.quantity > 0) {
            availableQuantity += stock.quantity;
        }
    }

    return {
        available: availableQuantity >= requiredQuantity,
        availableQuantity,
        requiredQuantity
    };
}

// Helper: Find available stock
async function findAvailableStock(itemId, requiredQuantity) {
    const stocks = await db.Stock.findAll({
        where: { itemId },
        order: [['createdAt', 'DESC']]
    });

    for (const stock of stocks) {
        if (stock.quantity >= requiredQuantity) {
            return stock;
        }
    }

    throw `No single stock entry with ${requiredQuantity} units available`;
}

// Helper: Deduct from stock
async function deductFromStock(stockId, quantity, transaction) {
    const stock = await db.Stock.findByPk(stockId);
    stock.quantity -= quantity;
    await stock.save({ transaction });
}

// Helper: Return component to stock
async function returnComponentToStock(componentId, transaction) {
    const component = await db.PCComponent.findByPk(componentId);
    if (component && component.stockId) {
        const stock = await db.Stock.findByPk(component.stockId);
        if (stock) {
            stock.quantity += component.quantity;
            await stock.save({ transaction });
        }
    }
}

// Get template statistics
async function getTemplateStats(templateId) {
    const template = await getById(templateId);
    
    // Get all PCs
    const allPCs = await db.PC.findAll();
    
    // Compare all PCs with this template
    let matchingPCs = 0;
    let partialMatchPCs = 0;
    let nonMatchingPCs = 0;

    for (const pc of allPCs) {
        const comparison = await comparePC(pc.id, templateId);
        if (comparison.matches) {
            matchingPCs++;
        } else if (comparison.matchPercentage >= 50) {
            partialMatchPCs++;
        } else {
            nonMatchingPCs++;
        }
    }

    return {
        templateId,
        templateName: template.name,
        totalPCs: allPCs.length,
        matchingPCs,
        partialMatchPCs,
        nonMatchingPCs,
        complianceRate: allPCs.length > 0 ? Math.round((matchingPCs / allPCs.length) * 100) : 0
    };
}

