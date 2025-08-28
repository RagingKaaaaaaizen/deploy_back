const roomLocationService = require('./room-location.service');

// GET all room locations
exports.getAll = (req, res, next) => {
    console.log('🔍 Room Location Controller - getAll called');
    roomLocationService.getAll()
        .then(rooms => {
            console.log('✅ Room Location Controller - getAll successful, sending', rooms.length, 'rooms');
            res.send(rooms);
        })
        .catch(error => {
            console.error('❌ Room Location Controller - getAll error:', error);
            next(error);
        });
};

// GET room location by ID
exports.getById = (req, res, next) => {
    roomLocationService.getById(req.params.id)
        .then(room => room ? res.send(room) : res.sendStatus(404))
        .catch(next);
};

// CREATE room location
exports.create = (req, res, next) => {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
        return res.status(401).send({ message: 'User authentication required' });
    }

    roomLocationService.create(req.body, req.user.id)
        .then(room => res.send(room))
        .catch(next);
};

// UPDATE room location
exports.update = (req, res, next) => {
    roomLocationService.update(req.params.id, req.body)
        .then(room => res.send(room))
        .catch(next);
};

// DELETE room location
exports.delete = (req, res, next) => {
    roomLocationService.delete(req.params.id)
        .then(() => res.send({ message: 'Room Location deleted successfully' }))
        .catch(next);
}; 