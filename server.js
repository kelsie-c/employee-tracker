// require dependencies
const mysql = require('mysql');
const inquirer = require('inquirer');
const express = require('express');
const { QueryTypes } = require('sequelize');
const sequelize = require('./config/connection');

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

// add department by getting highest department ID and then asking user for department name
async function addDepartment() {
    const deptName = inquirer.prompt([
        {
            type: 'input',
            message: 'What is the department\'s name?',
            name: 'deptName'
        }
    ])
    const query = "SELECT MAX(id) from department";
    const maxID = await sequelize.query(query, { plain: true });
    const newID = Object.values(maxID)[0] + 1;
    console.log(newID);
}