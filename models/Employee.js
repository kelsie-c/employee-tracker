const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

class Employee extends Model {}

Employee.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        firstName: {
            type: DataTypes.STRING
        },
        lastName: {
            type: DataTypes.STRING
        },
        roleId: {
            type: DataTypes.INTEGER
        },
        managerId: {
            type: DataTypes.INTEGER
        }
    },
    {
        sequelize,
        timestamps: false,
        freezeTableName: true,
        underscored: true,
        modelName: 'employee'
    }
);

module.exports = Employee;