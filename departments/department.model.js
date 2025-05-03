// models/department.model.js

module.exports = (sequelize, DataTypes) => {
    const Department = sequelize.define('Department', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true
      }
    });
  
    Department.associate = (models) => {
      Department.hasMany(models.Employee, {
        foreignKey: 'departmentId',
        as: 'employees',
        onDelete: 'SET NULL'
      });
    };
  
    return Department;
  };
  