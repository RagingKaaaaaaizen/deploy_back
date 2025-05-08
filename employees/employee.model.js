module.exports = (sequelize, DataTypes) => {
  const Employee = sequelize.define('Employee', {
    employeeId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      references: {
        model: 'accounts',
        key: 'email'
      }
    },
    position: {
      type: DataTypes.STRING,
      allowNull: false
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    hireDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      allowNull: false,
      defaultValue: 'Active'
    }
  });

  Employee.associate = (models) => {
    Employee.belongsTo(models.Account, {
      foreignKey: 'email',
      targetKey: 'email',
      as: 'account'
    });
    Employee.belongsTo(models.Department, {
      foreignKey: 'departmentId',
      as: 'department'
    });
  };

  return Employee;
};
