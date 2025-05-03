const express = require('express');
const router = express.Router();
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const employeeService = require('./employee.service');

// Routes
router.post('/', authorize(Role.Admin), create);
router.get('/', authorize(), getAll);
router.get('/:id', authorize(), getById);
router.put('/:id', authorize(Role.Admin), update);
router.delete('/:id', authorize(Role.Admin), _delete);
router.post('/:id', authorize(Role.Admin), transfer);

// Handlers
async function create(req, res, next) {
    try {
        const employee = await employeeService.create(req.body);
        res.status(201).json(employee);
    } catch (err) {
        next(err);
    }
}

async function getAll(req, res, next) {
    try {
        const employees = await employeeService.getAll();
        res.json(employees);
    } catch (err) {
        next(err);
    }
}

async function getById(req, res, next) {
    try {
        const employee = await employeeService.getById(req.params.id);
        if (!employee) return res.status(404).json({ message: 'Employee not found' });
        res.json(employee);
    } catch (err) {
        next(err);
    }
}

async function update(req, res, next) {
    try {
        const employee = await employeeService.update(req.params.id, req.body);
        res.json(employee);
    } catch (err) {
        next(err);
    }
}

async function _delete(req, res, next) {
    try {
        await employeeService.delete(req.params.id);
        res.json({ message: 'Employee deleted' });
    } catch (err) {
        next(err);
    }
}

async function transfer(req, res, next) {
    try {
        await employeeService.transfer(req.params.id, req.body.departmentId);
        res.json({ message: 'Employee transferred' });
    } catch (err) {
        next(err);
    }
}

module.exports = router;
