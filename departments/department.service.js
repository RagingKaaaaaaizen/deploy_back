const db = require('../_helpers/db');
const Department = db.Department;

async function create(params) {
    const department = new Department(params);
    await department.save();
    return department;
}

async function getAll() {
    const departments = await Department.findAll({
        include: [{
            model: db.Employee,
            attributes: ['id']
        }]
    });

    return departments.map(d => ({
        ...d.toJSON(),
        employeeCount: d.Employees.length
    }));
}

async function getById(id) {
    return await Department.findByPk(id, {
        include: [{
            model: db.Employee
        }]
    });
}

async function update(id, params) {
    const department = await getById(id);
    if (!department) throw 'Department not found';

    Object.assign(department, params);
    await department.save();
    return department;
}

async function _delete(id) {
    const department = await getById(id);
    if (!department) throw 'Department not found';

    await department.destroy();
}

module.exports = {
    create,
    getAll,
    getById,
    update,
    delete: _delete
};
