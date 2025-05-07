const db = require('../_helpers/db');

async function create(params) {
    // Find the account using the email
    const account = await db.Account.findOne({ where: { email: params.email } });
    if (!account) {
        throw new Error('Account not found with the provided email');
    }

    // Create the employee with the accountId and email
    const employee = await db.Employee.create({
        ...params,
        accountId: account.id,
        email: account.email
    });

    return employee;
}

async function getAll() {
    return await db.Employee.findAll({
        include: [db.User, db.Department]
    });
}

async function getById(id) {
    return await db.Employee.findByPk(id, {
        include: [db.User, db.Department]
    });
}

async function update(id, params) {
    const employee = await getById(id);
    if (!employee) throw new Error('Employee not found');

    Object.assign(employee, params);
    await employee.save();

    return employee;
}

async function _delete(id) {
    const employee = await getById(id);
    if (!employee) throw new Error('Employee not found');

    await employee.destroy();
}

async function transfer(id, departmentId) {
    const employee = await getById(id);
    if (!employee) throw new Error('Employee not found');

    await employee.update({ departmentId });

    await db.Workflow.create({
        employeeId: employee.id,
        type: 'Transfer',
        status: 'Pending',
        details: { newDepartmentId: departmentId }
    });
}

module.exports = {
    create,
    getAll,
    getById,
    update,
    delete: _delete,
    transfer
};
