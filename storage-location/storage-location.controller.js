const locationService = require('./storage-location.service');

// GET all locations
exports.getAll = (req, res, next) => {
    locationService.getAll()
        .then(locations => res.json(locations))
        .catch(next);
};

// GET location by ID
exports.getById = (req, res, next) => {
    locationService.getById(req.params.id)
        .then(location => location ? res.json(location) : res.sendStatus(404))
        .catch(next);
};

// CREATE location
exports.create = (req, res, next) => {
    locationService.create(req.body)
        .then(location => res.json(location))
        .catch(next);
};

// UPDATE location
exports.update = (req, res, next) => {
    locationService.update(req.params.id, req.body)
        .then(location => res.json(location))
        .catch(next);
};

// DELETE location
exports._delete = (req, res, next) => {
    locationService.delete(req.params.id)
        .then(() => res.json({ message: 'Location deleted successfully' }))
        .catch(next);
};
