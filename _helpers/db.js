const config = require('../config.json');
const mysql = require('mysql2/promise');
const { Sequelize, DataTypes } = require('sequelize');

module.exports = db = {};

initialize();

async function initialize() {
    // create db if it doesn't already exist
    const { host, port, user, password, database } = config.database;
    const connection = await mysql.createConnection({ host, port, user, password });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);

    // connect to db
    const sequelize = new Sequelize(database, user, password, { dialect: 'mysql' });

    // init models and add them to the exported db object
    db.Account = require('../accounts/account.model')(sequelize, DataTypes);
    db.RefreshToken = require('../accounts/refresh-token.model')(sequelize);
    db.Employee = require('../employees/employee.model')(sequelize, DataTypes);
    db.Department = require('../departments/department.model')(sequelize, DataTypes);
    db.Workflow = require('../workflows/workflow.model')(sequelize, DataTypes);
    db.Request = require('../requests/request.model')(sequelize, DataTypes);


   // After existing model imports

db.ItemCategory = require('../category/category.model')(sequelize, DataTypes);
db.Item = require('../items/item.model')(sequelize, DataTypes);
db.Stock = require('../stock/stock.model')(sequelize, DataTypes);

// Relationships for new models
db.ItemCategory.hasMany(db.Item, { foreignKey: 'categoryId', as: 'items' });
db.Item.belongsTo(db.ItemCategory, { foreignKey: 'categoryId', as: 'category' });

db.Item.hasMany(db.Stock, { foreignKey: 'itemId', as: 'stocks' });
db.Stock.belongsTo(db.Item, { foreignKey: 'itemId', as: 'item' });

db.Account.hasMany(db.Stock, { foreignKey: 'createdBy', as: 'userStocks' });
db.Stock.belongsTo(db.Account, { foreignKey: 'createdBy', as: 'user' });
 
    // define relationships
    db.Account.hasMany(db.RefreshToken, { onDelete: 'CASCADE' });
    db.RefreshToken.belongsTo(db.Account);

    db.Account.hasOne(db.Employee, { foreignKey: 'accountId', as: 'employee' });
    db.Employee.belongsTo(db.Account, { foreignKey: 'accountId' });

    db.Department.hasMany(db.Employee, { foreignKey: 'departmentId', as: 'employees' });
    db.Employee.belongsTo(db.Department, { foreignKey: 'departmentId' });

    db.Employee.hasMany(db.Workflow, { foreignKey: 'employeeId' });
    db.Workflow.belongsTo(db.Employee, { foreignKey: 'employeeId' });

    db.Employee.hasMany(db.Request, { foreignKey: 'employeeId' });
    db.Request.belongsTo(db.Employee, { foreignKey: 'employeeId' });



    // sync all models with database
    await sequelize.sync({ alter: true });

    // expose sequelize instance to be used throughout the app
    db.sequelize = sequelize;
    db.Sequelize = Sequelize;
}
