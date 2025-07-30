const itemService = require('./item.service');

// GET all items
exports.getAll = (req, res, next) => {
    itemService.getAll()
        .then(items => res.json(items))
        .catch(next);
};

// GET item by ID
exports.getById = (req, res, next) => {
    itemService.getById(req.params.id)
        .then(item => item ? res.json(item) : res.sendStatus(404))
        .catch(next);
};

// CREATE item
exports.create = (req, res, next) => {
    itemService.create(req.body)
        .then(item => res.json(item))
        .catch(next);
};

// UPDATE item
exports.update = (req, res, next) => {
    itemService.update(req.params.id, req.body)
        .then(item => res.json(item))
        .catch(next);
};

// DELETE item
exports._delete = (req, res, next) => {
    itemService.delete(req.params.id)
        .then(() => res.json({ message: 'Item deleted successfully' }))
        .catch(next);
};
