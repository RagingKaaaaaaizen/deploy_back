const db = require('../_helpers/db');
const Workflow = db.Workflow;

async function create(params) {
    const workflow = new Workflow(params);
    await workflow.save();
    return workflow;
}

async function getByEmployeeId(employeeId) {
    return await Workflow.findAll({
        where: { employeeId },
        include: [{
            model: db.Employee,
            attributes: ['id', 'firstName', 'lastName']
        }]
    });
}

async function getById(id) {
    return await Workflow.findByPk(id, {
        include: [{
            model: db.Employee,
            attributes: ['id', 'firstName', 'lastName']
        }]
    });
}

async function updateStatus(id, status) {
    const workflow = await getById(id);
    if (!workflow) throw 'Workflow not found';
    
    await workflow.update({ 
        status,
        endDate: status === 'completed' ? new Date() : null
    });
    return workflow;
}

async function createOnboarding(params) {
    const workflow = new Workflow({
        ...params,
        type: 'Onboarding',
        status: 'Pending'
    });
    await workflow.save();
    return workflow;
}

async function getAll() {
    return await Workflow.findAll({
        include: [{
            model: db.Employee,
            attributes: ['id', 'firstName', 'lastName']
        }]
    });
}

async function update(id, params) {
    const workflow = await getById(id);
    if (!workflow) throw 'Workflow not found';
    
    Object.assign(workflow, params);
    await workflow.save();
    return workflow;
}

async function _delete(id) {
    const workflow = await getById(id);
    if (!workflow) throw 'Workflow not found';
    
    await workflow.destroy();
}

module.exports = {
    create,
    getByEmployeeId,
    getById,
    updateStatus,
    createOnboarding,
    getAll,
    update,
    delete: _delete
}; 