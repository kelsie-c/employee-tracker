const mysql = require('mysql');
const inquirer = require('inquirer');
const express = require('express');
const sequelize = require('./config/connection');

const app = express();
const PORT = process.env.PORT || 5001;

sequelize.sync({ force: false }).then(() => {
    app.listen(PORT, () => console.log('Welcome to the Employee Tracker!'));
    startApp();
  });

const startApp = () => {
    inquirer.prompt([
        {
            type: 'list',
            message: 'Which would you like to do?',
            choices: ['Add Data', 'View Data', 'Update Data'],
            name: 'action'
        }
    ])
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