const categoryService = require('./category.service');

// GET all categories
exports.getAll = (req, res, next) => {
    categoryService.getAll()
        .then(categories => res.json(categories))
        .catch(next);
};

// GET category by ID
exports.getById = (req, res, next) => {
    categoryService.getById(req.params.id)
        .then(category => category ? res.json(category) : res.sendStatus(404))
        .catch(next);
};

// CREATE category
exports.create = (req, res, next) => {
    categoryService.create(req.body)
        .then(category => res.json(category))
        .catch(next);
};

// UPDATE category
exports.update = (req, res, next) => {
    categoryService.update(req.params.id, req.body)
        .then(category => res.json(category))
        .catch(next);
};

// DELETE category
exports._delete = (req, res, next) => {
    categoryService.delete(req.params.id)
        .then(() => res.json({ message: 'Category deleted successfully' }))
        .catch(next);
};
