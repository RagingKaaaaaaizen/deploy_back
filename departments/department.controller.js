const express = require('express');
const router = express.Router();
const departmentService = require('./department.service');
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');

// Routes
router.get('/', authorize(), getAll);
router.get('/:id', authorize(), getById);
router.post('/', authorize(Role.Admin), create);
router.put('/:id', authorize(Role.Admin), update);
router.delete('/:id', authorize(Role.Admin), _delete);

// Handlers
async function getAll(req, res, next) {
    try {
        const departments = await departmentService.getAll();
        res.json(departments);
    } catch (err) {
        next(err);
    }
}

async function getById(req, res, next) {
    try {
        const department = await departmentService.getById(req.params.id);
        if (!department) return res.status(404).json({ message: 'Department not found' });
        res.json(department);
    } catch (err) {
        next(err);
    }
}

async function create(req, res, next) {
    try {
        const department = await departmentService.create(req.body);
        res.status(201).json(department);
    } catch (err) {
        next(err);
    }
}

async function update(req, res, next) {
    try {
        const department = await departmentService.update(req.params.id, req.body);
        res.json(department);
    } catch (err) {
        next(err);
    }
}

async function _delete(req, res, next) {
    try {
        await departmentService.delete(req.params.id);
        res.json({ message: 'Department deleted successfully' });
    } catch (err) {
        next(err);
    }
}

module.exports = router;
