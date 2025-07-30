const db = require('../_helpers/db');
const Item = db.Item;
const ItemCategory = db.ItemCategory; // Import ItemCategory to check categoryId

module.exports = {
    getAll,
    getById,
    create,
    update,
    _delete
};
async function getAll() {
    // Fetch all items
    const items = await db.Item.findAll();

    // Fetch categories manually (no associations used)
    const categories = await db.ItemCategory.findAll();

    // Map category name to each item
    return items.map(item => {
        const category = categories.find(c => c.id === item.categoryId);
        return {
            ...item.toJSON(),
            categoryName: category ? category.name : 'No Category'
        };
    });
}

async function getAll() {
    return await Item.findAll({
        include: [{
            model: ItemCategory,
            as: 'category',
            attributes: ['name'] // Only include the category name
        }]
    });
}

async function getById(id) {
    return await Item.findByPk(id, {
        include: [{
            model: ItemCategory,
            as: 'category',
            attributes: ['name']
        }]
    });
}

async function create(params) {
    // Validate categoryId
    const category = await ItemCategory.findByPk(params.categoryId);
    if (!category) throw 'Invalid categoryId';

    const item = new Item(params);
    await item.save();
    return item;
}

async function getAll() {
  const items = await db.Item.findAll();

  // Fetch categories separately and map names
  const categories = await db.ItemCategory.findAll();
  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat.id] = cat.name;
  });

  // Attach category name to items
  return items.map(item => ({
    ...item.toJSON(),
    categoryName: categoryMap[item.categoryId] || 'Uncategorized'
  }));
}


async function update(id, params) {
    const item = await getById(id);

    // validate
    if (!item) throw 'Item not found';

    // Validate categoryId if it's being updated
    if (params.categoryId && params.categoryId !== item.categoryId) {
        const category = await ItemCategory.findByPk(params.categoryId);
        if (!category) throw 'Invalid categoryId';
    }


    Object.assign(item, params);
    await item.save();

    return item;
}

async function _delete(id) {
    const item = await getById(id);
    if (!item) throw 'Item not found';

    await item.destroy();
}
