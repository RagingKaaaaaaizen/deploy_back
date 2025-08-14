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
    const sequelize = new Sequelize(database, user, password, { 
        dialect: 'mysql',
        logging: false // Turn off Sequelize logging
    });

    // 🎓✨
    console.log('\n🎓✨ Together we\'ll graduate as a team. Lets do this! ✨🎓\n');

    // init models and add them to the exported db object
    db.Account = require('../accounts/account.model')(sequelize);
    db.RefreshToken = require('../accounts/refresh-token.model')(sequelize);
    db.Employee = require('../employees/employee.model')(sequelize, DataTypes);
    db.Department = require('../departments/department.model')(sequelize, DataTypes);
    db.Workflow = require('../workflows/workflow.model')(sequelize, DataTypes);
    db.Request = require('../requests/request.model')(sequelize, DataTypes);

    // New Models
    db.Brand = require('../brand/brand.model')(sequelize, DataTypes);
    db.Category = require('../category/category.model')(sequelize, DataTypes);
    db.Item = require('../items/item.model')(sequelize, DataTypes);
    db.Stock = require('../stock/stock.model')(sequelize, DataTypes);
    db.StorageLocation = require('../storage-location/storage-location.model')(sequelize, DataTypes);
    db.RoomLocation = require('../pc/room-location.model')(sequelize, DataTypes);
    db.PC = require('../pc/pc.model')(sequelize, DataTypes);
    db.PCComponent = require('../pc/pc-component.model')(sequelize, DataTypes);
    db.SpecificationField = require('../specifications/specification.model')(sequelize, DataTypes);
    db.Dispose = require('../dispose/dispose.model')(sequelize, DataTypes);

    // ---------------- RELATIONSHIPS ----------------
    // Storage Location -> Stock
    db.StorageLocation.hasMany(db.Stock, { foreignKey: 'locationId', as: 'stocks' });
    db.Stock.belongsTo(db.StorageLocation, { foreignKey: 'locationId', as: 'location' });




    // Brand -> Item
    db.Brand.hasMany(db.Item, { foreignKey: 'brandId', as: 'items' });
    db.Item.belongsTo(db.Brand, { foreignKey: 'brandId', as: 'brand' });

    // Category -> Item
    db.Category.hasMany(db.Item, { foreignKey: 'categoryId', as: 'items' });
    db.Item.belongsTo(db.Category, { foreignKey: 'categoryId', as: 'category' });

    // Item -> Stock
    db.Item.hasMany(db.Stock, { foreignKey: 'itemId', as: 'stocks' });
    db.Stock.belongsTo(db.Item, { foreignKey: 'itemId', as: 'item' });

    // Account -> Stock
    db.Account.hasMany(db.Stock, { foreignKey: 'createdBy', as: 'userStocks' });
    db.Stock.belongsTo(db.Account, { foreignKey: 'createdBy', as: 'user' });

    // Room Location Relationships
    db.Account.hasMany(db.RoomLocation, { foreignKey: 'createdBy', as: 'userRoomLocations' });
    db.RoomLocation.belongsTo(db.Account, { foreignKey: 'createdBy', as: 'user' });

    // PC Relationships
    db.RoomLocation.hasMany(db.PC, { foreignKey: 'roomLocationId', as: 'pcs' });
    db.PC.belongsTo(db.RoomLocation, { foreignKey: 'roomLocationId', as: 'roomLocation' });

    db.Account.hasMany(db.PC, { foreignKey: 'createdBy', as: 'userPCs' });
    db.PC.belongsTo(db.Account, { foreignKey: 'createdBy', as: 'user' });

    // PC Component Relationships
    db.PC.hasMany(db.PCComponent, { foreignKey: 'pcId', as: 'components' });
    db.PCComponent.belongsTo(db.PC, { foreignKey: 'pcId', as: 'pc' });

    db.Item.hasMany(db.PCComponent, { foreignKey: 'itemId', as: 'pcComponents' });
    db.PCComponent.belongsTo(db.Item, { foreignKey: 'itemId', as: 'item' });

    db.Stock.hasMany(db.PCComponent, { foreignKey: 'stockId', as: 'pcComponents' });
    db.PCComponent.belongsTo(db.Stock, { foreignKey: 'stockId', as: 'stock' });

    db.Account.hasMany(db.PCComponent, { foreignKey: 'createdBy', as: 'userPCComponents' });
    db.PCComponent.belongsTo(db.Account, { foreignKey: 'createdBy', as: 'user' });

    // Specification Field Relationships
    db.Category.hasMany(db.SpecificationField, { foreignKey: 'categoryId', as: 'specificationFields' });
    db.SpecificationField.belongsTo(db.Category, { foreignKey: 'categoryId', as: 'category' });

    // Dispose Relationships (Added)
    db.Item.hasMany(db.Dispose, { foreignKey: 'itemId', as: 'disposals' });
    db.Dispose.belongsTo(db.Item, { foreignKey: 'itemId', as: 'item' });
    
    db.StorageLocation.hasMany(db.Dispose, { foreignKey: 'locationId', as: 'disposals' });
    db.Dispose.belongsTo(db.StorageLocation, { foreignKey: 'locationId', as: 'location' });
    
    db.Account.hasMany(db.Dispose, { foreignKey: 'createdBy', as: 'userDisposals' });
    db.Dispose.belongsTo(db.Account, { foreignKey: 'createdBy', as: 'user' });

    // Stock-Dispose Direct Relationship
    db.Dispose.hasMany(db.Stock, { foreignKey: 'disposeId', as: 'stockEntries' });
    db.Stock.belongsTo(db.Dispose, { foreignKey: 'disposeId', as: 'disposal' });

    // ---------------- Other Existing Relationships ----------------
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
    await sequelize.sync({ alter: true }); // Use alter to preserve existing data

    // expose sequelize instance
    db.sequelize = sequelize;
    db.Sequelize = Sequelize;
}
