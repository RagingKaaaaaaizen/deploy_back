const express = require('express');
const router = express.Router();
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const brandService = require('./brand.service');

// Routes
router.get('/', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), getAll);
router.get('/:id', authorize([Role.SuperAdmin, Role.Admin, Role.Viewer]), getById);
router.post('/', authorize([Role.SuperAdmin, Role.Admin]), create);
router.put('/:id', authorize([Role.SuperAdmin, Role.Admin]), update);
router.delete('/:id', authorize([Role.SuperAdmin, Role.Admin]), _delete);

module.exports = router;

function getAll(req, res, next) {
    brandService.getAll()
        .then(brands => res.json(brands))
        .catch(next);
}

function getById(req, res, next) {
    brandService.getById(req.params.id)
        .then(brand => brand ? res.json(brand) : res.sendStatus(404))
        .catch(next);
}

function create(req, res, next) {
    brandService.create(req.body)
        .then(brand => res.json(brand))
        .catch(next);
}

function update(req, res, next) {
    brandService.update(req.params.id, req.body)
        .then(brand => res.json(brand))
        .catch(next);
}

function _delete(req, res, next) {
    brandService.delete(req.params.id)
        .then(() => res.json({ message: 'Brand deleted successfully' }))
        .catch(next);
}
