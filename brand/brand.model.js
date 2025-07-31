module.exports = (sequelize, DataTypes) => {
  const Brand = sequelize.define('Brand', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: true }
  });
  return Brand;
};
