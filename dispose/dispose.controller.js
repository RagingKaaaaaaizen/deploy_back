const disposeService = require('./dispose.service');
const Joi = require('joi');
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');

// Validation schemas
const createSchema = Joi.object({
    stockEntryId: Joi.number().integer().required(),
    quantity: Joi.number().integer().min(1).required(),
    disposalValue: Joi.number().precision(2).min(0).optional().default(0),
    locationId: Joi.number().integer().required(),
    reason: Joi.string().allow('').optional()
});

const updateSchema = Joi.object({
    quantity: Joi.number().integer().min(1).optional(),
    disposalValue: Joi.number().precision(2).min(0).optional(),
    locationId: Joi.number().optional(),
    reason: Joi.string().optional()
});

// GET all disposal records
exports.getAll = (req, res, next) => {
    disposeService.getAll()
        .then(disposals => res.send(disposals))
        .catch(next);
};

// GET single disposal record
exports.getById = (req, res, next) => {
    disposeService.getById(req.params.id)
        .then(disposal => disposal ? res.send(disposal) : res.sendStatus(404))
        .catch(next);
};

// POST create new disposal record
exports.create = (req, res, next) => {
    console.log('=== CREATE DISPOSAL REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Request body type:', typeof req.body);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('User:', req.user);
    console.log('Headers:', req.headers);
    
    try {
        // For testing purposes, use a default user ID if not authenticated
        let userId = 1; // Default user ID for testing
        if (req.user && req.user.id) {
            userId = req.user.id;
            console.log('Using authenticated user ID:', userId);
        } else {
            console.log('No authenticated user, using default user ID:', userId);
        }

        console.log('=== VALIDATION STEP ===');
        console.log('Validating against schema:', createSchema.describe());
        const { error, value } = createSchema.validate(req.body);
        if (error) {
            console.log('Validation error:', error.details[0].message);
            console.log('Full validation error:', error);
            return res.status(400).send({ message: error.details[0].message });
        }
        console.log('Validation passed, validated value:', value);

        console.log('Creating disposal with validated data:', value);
        console.log('User ID:', userId);
        console.log('Calling disposeService.create with:', { value, userId: userId });
        
        disposeService.create(value, userId)
            .then(disposal => {
                console.log('Disposal created successfully:', disposal.id);
                res.send(disposal);
            })
            .catch(error => {
                console.error('Error creating disposal:', error);
                const errorMessage = error.message || 'Unknown error occurred';
                res.status(500).send({ message: errorMessage });
            });
    } catch (err) {
        console.error('Unexpected error in create:', err);
        res.status(500).send({ message: 'Internal server error' });
    }
};

// PUT update disposal record
exports.update = (req, res, next) => {
    const { error, value } = updateSchema.validate(req.body);
    if (error) {
        return res.status(400).send({ message: error.details[0].message });
    }

    disposeService.update(req.params.id, value)
        .then(disposal => res.send(disposal))
        .catch(next);
};

// DELETE disposal record
exports.delete = (req, res, next) => {
    disposeService.delete(req.params.id)
        .then(() => res.send({ message: 'Disposal record deleted successfully' }))
        .catch(next);
};

// GET disposals by item
exports.getByItem = (req, res, next) => {
    disposeService.getDisposalsByItem(req.params.itemId)
        .then(disposals => res.send(disposals))
        .catch(next);
};

// POST validate disposal
exports.validateDisposal = (req, res, next) => {
    console.log('=== VALIDATE DISPOSAL REQUEST ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user);
    
    const { itemId, quantity } = req.body;
    
    if (!itemId || !quantity) {
        console.log('ERROR: Missing itemId or quantity');
        return res.status(400).send({ message: 'Item ID and quantity are required' });
    }

    console.log('Calling disposeService.validateDisposal with:', itemId, quantity);
    disposeService.validateDisposal(itemId, quantity)
        .then(validation => {
            console.log('Validation result:', validation);
            res.send(validation);
        })
        .catch(error => {
            console.error('Error in validateDisposal:', error);
            next(error);
        });
};

// GET disposal with stock information
exports.getDisposalWithStock = (req, res, next) => {
    disposeService.getDisposalWithStock(req.params.id)
        .then(data => res.send(data))
        .catch(next);
};

// GET stock entries with disposal information
exports.getStockWithDisposal = (req, res, next) => {
    disposeService.getStockWithDisposal(req.params.itemId)
        .then(data => res.send(data))
        .catch(next);
};

// POST return disposed items back to stock
exports.returnToStock = (req, res, next) => {
    console.log('=== RETURN TO STOCK REQUEST ===');
    console.log('DisposalId:', req.params.id);
    console.log('User:', req.user);
    
    try {
        // For testing purposes, use a default user ID if not authenticated
        let userId = 1; // Default user ID for testing
        if (req.user && req.user.id) {
            userId = req.user.id;
            console.log('Using authenticated user ID:', userId);
        } else {
            console.log('No authenticated user, using default user ID:', userId);
        }

        const disposalId = parseInt(req.params.id);
        if (!disposalId) {
            return res.status(400).send({ message: 'Valid disposal ID is required' });
        }

        console.log('Returning disposal to stock:', disposalId);
        console.log('User ID:', userId);
        
        disposeService.returnToStock(disposalId, userId)
            .then(result => {
                console.log('Return to stock successful:', result);
                res.send(result);
            })
            .catch(error => {
                console.error('Error returning to stock:', error);
                const errorMessage = error.message || 'Unknown error occurred';
                res.status(500).send({ message: errorMessage });
            });
    } catch (err) {
        console.error('Unexpected error in returnToStock:', err);
        res.status(500).send({ message: 'Internal server error' });
    }
};

// POST return partial disposed items back to stock
exports.returnToStockPartial = (req, res, next) => {
    console.log('=== PARTIAL RETURN TO STOCK REQUEST ===');
    console.log('DisposalId:', req.params.id);
    console.log('Request body:', req.body);
    console.log('User:', req.user);
    
    try {
        // For testing purposes, use a default user ID if not authenticated
        let userId = 1; // Default user ID for testing
        if (req.user && req.user.id) {
            userId = req.user.id;
            console.log('Using authenticated user ID:', userId);
        } else {
            console.log('No authenticated user, using default user ID:', userId);
        }

        const disposalId = parseInt(req.params.id);
        if (!disposalId) {
            return res.status(400).send({ message: 'Valid disposal ID is required' });
        }

        const { quantity, remarks } = req.body;
        if (!quantity || quantity <= 0) {
            return res.status(400).send({ message: 'Valid quantity is required' });
        }

        console.log('Partial return to stock:', disposalId, 'Quantity:', quantity, 'Remarks:', remarks);
        console.log('User ID:', userId);
        
        disposeService.returnToStockPartial(disposalId, quantity, remarks, userId)
            .then(result => {
                console.log('Partial return to stock successful:', result);
                res.send(result);
            })
            .catch(error => {
                console.error('Error in partial return to stock:', error);
                const errorMessage = error.message || 'Unknown error occurred';
                res.status(500).send({ message: errorMessage });
            });
    } catch (err) {
        console.error('Unexpected error in returnToStockPartial:', err);
        res.status(500).send({ message: 'Internal server error' });
    }
};

// Test endpoint to check if backend is working
exports.test = (req, res, next) => {
    console.log('=== TEST ENDPOINT CALLED ===');
    res.send({ 
        message: 'Dispose backend is working', 
        timestamp: new Date(),
        user: req.user ? req.user.email : 'No user',
        endpoint: '/api/dispose/test'
    });
}; 