// require dependencies
const mysql = require('mysql');
const inquirer = require('inquirer');
const express = require('express');
const { DataTypes } = require('sequelize');
const sequelize = require('./config/connection');
const Role = require('./models/Role');
const Employee = require('./models/Employee');
const Department = require('./models/Department');


// add middleware
const app = express();
const PORT = process.env.PORT || 5001;

// get user & password info and initialize app
sequelize.sync({ force: false }).then(() => {
    app.listen(PORT, () => {console.log('Welcome to the Employee Tracker!'); startApp();});
});

// initialize app
const startApp = () => {
    // prompt user for first choice
    inquirer.prompt([
        {
            type: 'list',
            message: 'Which would you like to do?',
            choices: ['Add Data', 'View Data', 'Update Data'],
            name: 'action'
        }
    ])
    // call appropriate function based on user selection
    .then(({action}) => {
        if(action === 'Add Data') {
            addData();
        } else if(action === 'View Data') {
            viewData();
        } else {
            updateData();
        }
    })
}

// add data function called from the startApp function
const addData = () => {
    inquirer.prompt([
        {
            type: 'list',
            message: 'What would you like to add?',
            choices: ['Department', 'Role', 'Employee', 'Go Back'],
            name: 'addToTable'
        }
    ])
    .then(({addToTable}) => {
        if(addToTable === 'Department') {
            addDepartment();
        } else if(addToTable === 'Role') {
            addRole();
        } else if(addToTable === 'Employee') {
            addEmployee();
        } else {
            startApp();
        }
    })
}

// add department by getting highest department ID and asking user for department name
async function addDepartment() {
    const getDept = await inquirer.prompt([
        {
            type: 'input',
            message: 'What is the department\'s name?',
            name: 'deptName'
        }
    ]);
    // const dept = await getDept.deptName;
    const query = "SELECT MAX(id) from department";
    const maxID = await sequelize.query(query, { plain: true });
    const newID = Object.values(maxID)[0] + 1;

    Department.create({
        id: newID,
        name: `${getDept.deptName}`
    })
    .catch(function(err) {
        // print the error details
        console.log(err);
    });
}

async function addRole() {
    // get list of departments
    const departments = await Department.findAll({
        attributes: ["name"]
    });
    const deptNames = [];
    for(department of departments) {
        deptNames.push(department.dataValues.name)
    };
    // console.log(deptNames);
    const getRole = await inquirer.prompt([
        {
            type: 'input',
            message: 'What is the new role\'s ID?',
            name: 'roleID'
        },
        {
            type: 'input',
            message: 'What is the role title?',
            name: 'roleTitle'
        },
        {
            type: 'input',
            message: 'What is the salary for this role?',
            name: 'roleSalary'
        },
        {
            type: 'list',
            message: 'Which department does this role belong to?',
            choices: deptNames,
            name: 'roleDept'
        }
    ]);
    // get dept ID
    const deptChosen = await Department.findOne({ where: { name: getRole.roleDept } });
    const deptID = deptChosen.dataValues.id;

    try {
        const role = await Role.create({ id: getRole.roleID, title: getRole.roleTitle, salary: getRole.roleSalary, departmentId: deptID })
    } catch (err) {
        console.log(err);
    }
}

async function addEmployee() {
    // get list of departments
    const departments = await Department.findAll({
        attributes: ["name"]
    });
    const deptNames = [];
    for(department of departments) {
        deptNames.push(department.dataValues.name)
    };
    // console.log(deptNames);
    const getEmployee = await inquirer.prompt([
        {
            type: 'input',
            message: 'What is the new employee\'s ID?',
            name: 'eID'
        },
        {
            type: 'input',
            message: 'What is the employee\'s first name?',
            name: 'eFirst'
        },
        {
            type: 'input',
            message: 'What is the employee\'s last name?',
            name: 'eLast'
        },
        {
            type: 'list',
            message: 'In which department does this employee work?',
            choices: deptNames,
            name: 'eDept'
        }        
    ]);
    const deptChosen = await Department.findOne({ where: { name: getEmployee.eDept } });
    const deptID = deptChosen.dataValues.id;
    const chooseRole = await Role.findAll({ where: {departmentId: deptID }});
    console.log(chooseRole);
    const roles = [];
    for(role of chooseRole) {
        roles.push(role.dataValues.title)
    }
    console.log(roles);

    const getEmpRole = await inquirer.prompt([
        {
            type: 'list',
            message: 'What is the employee\s role?',
            choices: roles,
            name: 'chosenRole'
        }
    ]);
    const chosenRole = await Role.findOne({ where: { title: getEmpRole.chosenRole }});
    const roleID = chosenRole.dataValues.id;

    const query = `SELECT first_name, last_name FROM employee JOIN role ON employee.role_id = role.id JOIN department ON role.department_id = department.id WHERE department.name = '${getEmployee.eDept}'`;
    const mgrNames = await sequelize.query(query);
    const allMgrs = [];
    for(let i = 0; i < Object.values(mgrNames)[0].length; i ++) {
        allMgrs.push(Object.values(mgrNames)[0][i].first_name + " " + Object.values(mgrNames)[0][i].last_name)
    }
    console.log(allMgrs);

    const getManager = await inquirer.prompt([
        {
            type: 'list',
            message: 'Who is this employee\'s manager?',
            choices: allMgrs,
            name: 'eManager'
        }
    ])
    const manager = getManager.eManager.split(" ");
    const query2 = `SELECT id FROM employee WHERE first_name = '${manager[0]}' and last_name = '${manager[1]}'`;

    const mgrID = await sequelize.query(query2, { plain: true });
   
    try {
        const employee = await Employee.create({ id: getEmployee.eID, firstName: getEmployee.eFirst, lastName: getEmployee.eLast, roleId: roleID, managerId: mgrID.id });
        console.log(employee);
    } catch (err) {
        console.log(err);
    }
}