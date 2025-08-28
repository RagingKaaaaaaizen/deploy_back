const pcComponentService = require('./pc-component.service');

// GET all PC components
exports.getAll = (req, res, next) => {
    pcComponentService.getAll()
        .then(components => res.send(components))
        .catch(next);
};

// GET PC components by PC ID
exports.getByPCId = (req, res, next) => {
    pcComponentService.getByPCId(req.params.pcId)
        .then(components => res.send(components))
        .catch(next);
};

// GET PC components by Item ID
exports.getByItemId = (req, res, next) => {
    pcComponentService.getByItemId(req.params.itemId)
        .then(components => res.send(components))
        .catch(next);
};

// GET PC component by ID
exports.getById = (req, res, next) => {
    pcComponentService.getById(req.params.id)
        .then(component => component ? res.send(component) : res.sendStatus(404))
        .catch(next);
};

// CREATE PC component
exports.create = (req, res, next) => {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
        return res.status(401).send({ message: 'User authentication required' });
    }

    pcComponentService.create(req.body, req.user.id)
        .then(component => res.send(component))
        .catch(next);
};

// UPDATE PC component
exports.update = (req, res, next) => {
    pcComponentService.update(req.params.id, req.body)
        .then(component => res.send(component))
        .catch(next);
};

// DELETE PC component
exports.delete = (req, res, next) => {
    pcComponentService.delete(req.params.id)
        .then(() => res.send({ message: 'PC Component deleted successfully' }))
        .catch(next);
};

// RETURN PC component to stock
exports.returnToStock = (req, res, next) => {
    pcComponentService.returnToStock(req.params.id)
        .then(result => res.send(result))
        .catch(next);
};

// GET accurate available stock for an item
exports.getAccurateAvailableStock = (req, res, next) => {
    const itemId = parseInt(req.params.itemId);
    if (!itemId) {
        return res.status(400).send({ message: 'Valid item ID is required' });
    }
    
    pcComponentService.getAccurateAvailableStockForItem(itemId)
        .then(availableStock => res.send({ 
            itemId: itemId,
            availableStock: availableStock 
        }))
        .catch(next);
}; 