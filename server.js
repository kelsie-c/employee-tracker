const mysql = require('mysql');
const inquirer = require('inquirer');
const sequelize = require('./config/connection');

sequelize.sync({ force: false }).then(() => {
    app.listen(PORT, () => console.log('Now listening'));
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

startApp();