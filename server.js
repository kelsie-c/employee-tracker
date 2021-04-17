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
            choices: ['Add Data', 'View Data', 'Update Data', 'Quit Application'],
            name: 'action'
        }
    ])
    // call appropriate function based on user selection
    .then(({action}) => {
        if(action === 'Add Data') {
            addData();
        } else if(action === 'View Data') {
            viewData();
        } else if(action === 'Update Data') {
            updateData();
        } else {
            console.log('Thank you for using the Employee Tracker. Have a nice day!')
            sequelize.close();
            process.exit(0);
            // return;
        }
    })
}
// -----------------------------------------------------------------------------------
// ADD DATA
// -----------------------------------------------------------------------------------
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

    try {
        Department.create({
            id: newID,
            name: `${getDept.deptName}`
        })
        console.log('Successfully added department!');
        startApp();
    } catch(err) {
        // print the error details
        console.log(err);
    };
}

async function addRole() {
    // get list of departments
    const departments = await Department.findAll({
        attributes: ["name"]
    });
    // create array of department names
    const deptNames = [];
    for(department of departments) {
        deptNames.push(department.dataValues.name)
    };

    // prompt user for role info
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

    // send to database
    // equivalent of 'INSERT INTO role (id, title, salary, department_id) VALUES(?,?,?,?)'
    try {
        const role = await Role.create({ id: getRole.roleID, title: getRole.roleTitle, salary: getRole.roleSalary, departmentId: deptID })
        console.log('Successfully added role!');
        startApp();
    } catch (err) {
        console.log(err);
    }
}

async function addEmployee() {
    // get list of departments
    const departments = await Department.findAll({
        attributes: ["name"]
    });
    // create array of dept names
    const deptNames = [];
    for(department of departments) {
        deptNames.push(department.dataValues.name)
    };
    
    // prompt user for employee info
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

    // identify selected department
    // equivalent of 'SELECT id FROM department WHERE name = ?'
    const deptChosen = await Department.findOne({ where: { name: getEmployee.eDept } });
    const deptID = deptChosen.dataValues.id;

    // create array of roles within the selected department
    // equivalent of 'SELECT id FROM role WHERE department_id = ?
    const chooseRole = await Role.findAll({ where: {departmentId: deptID }});
    // console.log(chooseRole);
    const roles = [];
    for(role of chooseRole) {
        roles.push(role.dataValues.title)
    }
    // console.log(roles);

    // prompt user for employee role
    const getEmpRole = await inquirer.prompt([
        {
            type: 'list',
            message: 'What is the employee\s role?',
            choices: roles,
            name: 'chosenRole'
        }
    ]);

    // get ID for selected role
    // equivalent of 'SELECT id FROM role WHERE title = ?'
    const chosenRole = await Role.findOne({ where: { title: getEmpRole.chosenRole }});
    const roleID = chosenRole.dataValues.id;

    // get names of all employees in selected department
    const query = `SELECT first_name, last_name FROM employee JOIN role ON employee.role_id = role.id JOIN department ON role.department_id = department.id WHERE department.name = '${getEmployee.eDept}'`;
    const mgrNames = await sequelize.query(query);
    const allMgrs = [];
    for(let i = 0; i < Object.values(mgrNames)[0].length; i ++) {
        allMgrs.push(Object.values(mgrNames)[0][i].first_name + " " + Object.values(mgrNames)[0][i].last_name)
    }
    // add NULL option
    allMgrs.push('None');
    // console.log(allMgrs);

    // prompt user to select a manager
    const getManager = await inquirer.prompt([
        {
            type: 'list',
            message: 'Who is this employee\'s manager?',
            choices: allMgrs,
            name: 'eManager'
        }
    ])

    // get manager's ID
    let mgrID;
    if(getManager.eManager === 'None') {
        mgrID = null;
    } else {
        const manager = getManager.eManager.split(" ");
        const query2 = `SELECT id FROM employee WHERE first_name = '${manager[0]}' and last_name = '${manager[1]}'`;
        const getID = await sequelize.query(query2, { plain: true });
        mgrID = getID.id;
    }
   
    // send to database
    try {
        const employee = await Employee.create({ id: getEmployee.eID, firstName: getEmployee.eFirst, lastName: getEmployee.eLast, roleId: roleID, managerId: mgrID });
        console.log('Successfully added employee!');
        startApp();
    } catch (err) {
        console.log(err);
    }
}

// -----------------------------------------------------------------------------------
// UPDATE DATA
// -----------------------------------------------------------------------------------
const updateData = () => {
    inquirer.prompt([
        {
            type: 'list',
            message: 'What would you like to update?',
            choices: ['Department', 'Role', 'Employee', 'Go Back'],
            name: 'addToTable'
        }
    ])
    .then(({addToTable}) => {
        if(addToTable === 'Department') {
            updateDepartment();
        } else if(addToTable === 'Role') {
            updateRole();
        } else if(addToTable === 'Employee') {
            updateEmployee();
        } else {
            startApp();
        }
    })
}

// add department by getting highest department ID and asking user for department name
async function updateDepartment() {
    // get department names
    const query = `SELECT name FROM department`;
    const deptNames = await sequelize.query(query, { raw: true });
    // add department names to choices array
    const deptChoices = [];
    for(department of deptNames[0]) {
        deptChoices.push(department.name);
    }

    // prompt user to select a department
    const getDept = await inquirer.prompt([
        {
            type: 'list',
            message: 'Which department would you like to update?',
            choices: deptChoices,
            name: 'upDept'
        }
    ]);

    const query2 = `SELECT * FROM department WHERE department.name = '${getDept.upDept}'`;
    const deptData = await sequelize.query(query2, { plain: true });
    // console.log(deptData);
    const deptID = deptData.id;
    const deptName = getDept.upDept;

    const updateDept = await inquirer.prompt([
        {
            type: 'confirm',
            message: `Would you like to update this department\'s id from ${deptID}?`,
            name: 'updateID'
        },
        {
            type: 'input',
            message: 'What is the department\'s new id?',
            name: 'newID',
            when: (answers) => answers.updateID === true
        },
        {
            type: 'confirm',
            message: `Would you like to update this department\'s name from ${deptName}?`,
            name: 'updateName'
        },
        {
            type: 'input',
            message: 'What is the department\'s new name?',
            name: 'newName',
            when: (answers) => answers.updateName === true
        }
    ])

    let id;
    let dept;
    if(updateDept.updateID) {
        id = updateDept.newID;
    } else {
        id = deptID;
    }

    if(updateDept.updateName) {
        dept = updateDept.newName;
    } else {
        dept = deptName;
    }

    try {
        Department.update({
            id: id,
            name: dept
        }, 
        {
            where: { name: deptName }
        })
        console.log('Successfully updated department!');
        startApp();
    } catch(err) {
        // print the error details
        console.log(err);
    };
}

async function updateRole() {
    // get list of departments
    const departments = await Department.findAll({
        attributes: ["name"]
    });
    // create array of department names
    const deptNames = [];
    for(department of departments) {
        deptNames.push(department.dataValues.name)
    };

    // get list of roles
    const roles = await Role.findAll({
        attributes: ["title"]
    });
    // create array of role names
    const roleNames = [];
    for(role of roles) {
        roleNames.push(role.dataValues.title)
    };

    // prompt user for role selection
    const updateRoleInfo = await inquirer.prompt([
        {
            type: 'list',
            message: 'Which role would you like to update?',
            choices: roleNames,
            name: 'chosenRole'
        }
    ])

    const query = `SELECT * FROM role WHERE role.title = '${updateRoleInfo.chosenRole}'`;
    const roleData = await sequelize.query(query, { plain: true });
    // console.log(deptData);
    const roleID = roleData.id;
    const roleTitle = updateRoleInfo.chosenRole;
    const roleSalary = roleData.salary;
    const roleDept = roleData.departmentId;

    // prompt user for role info
    const updRole = await inquirer.prompt([
        {
            type: 'confirm',
            message: 'Would you like to update the role\'s ID?',
            name: 'updateID'
        },
        {
            type: 'input',
            message: 'What is the role\'s new ID?',
            name: 'newID',
            when: (answers) => answers.updateID === true
        },
        {
            type: 'confirm',
            message: 'Would you like to update the role\'s title?',
            name: 'updateTitle'
        },
        {
            type: 'input',
            message: 'What is the role\'s new title?',
            name: 'newTitle',
            when: (answers) => answers.updateTitle === true
        },
        {
            type: 'confirm',
            message: 'Would you like to update the role\'s salary?',
            name: 'updateSalary'
        },
        {
            type: 'input',
            message: 'What is the role\'s new salary?',
            name: 'newSalary',
            when: (answers) => answers.updateSalary === true
        },
        {
            type: 'confirm',
            message: 'Would you like to update the role\'s department?',
            name: 'updateDept'
        },
        {
            type: 'list',
            message: 'What is the role\'s new department?',
            choices: deptNames,
            name: 'newDept',
            when: (answers) => answers.updateDept === true
        }
    ])

    let id = roleID;
    let title = roleTitle;
    let salary = roleSalary;
    let dept = roleDept;

    if(updRole.updateID) {
        id = updRole.newID;
    }
    if(updRole.updateTitle) {
        title = updRole.newTitle;
    }
    if(updRole.updateSalary) {
        salary = updRole.newSalary;
    }
    if(updRole.updateDept) {
        dept = updRole.newDept;
    }

    try {
        Role.update({
            id: id,
            title: title,
            salary: salary,
            department_id: dept
        }, 
        {
            where: { title: roleTitle }
        })
        console.log('Successfully updated role!');
        startApp();
    } catch(err) {
        // print the error details
        console.log(err);
    };
}

async function updateEmployee() {
    // get list of departments
    const roles = await Role.findAll({
        attributes: ["title"]
    });
    // console.log(roles)
    // create array of dept names
    const roleNames = [];
    for(role of roles) {
        roleNames.push(role.dataValues.title)
    };
    
    // prompt user for employee info
    const selectRole = await inquirer.prompt([
        {
            type: 'list',
            message: 'What is the employee\'s role that you would like to update?',
            choices: roleNames,
            name: 'roleToUpdate'
        },   
    ]);

    const getRoleID = await Role.findOne({ where: {title: selectRole.roleToUpdate } });
    const findID = getRoleID.dataValues.id;
    
    const query4 = `SELECT CONCAT(first_name, " ", last_name) AS employees FROM employee WHERE role_id = '${findID}'`;
    const getEmployees = await sequelize.query(query4, { raw: true });
    const chooseEmployee = [];
    for(employee of getEmployees[0]) {
        chooseEmployee.push(employee.employees)
    }

    const selectEmployee = await inquirer.prompt([
        {
            type: 'list',
            message: 'Which employee would you like to update?',
            choices: chooseEmployee,
            name: 'updateEmployee'
        }
    ])

    const employeeName = selectEmployee.updateEmployee.split(" ");
    const query2 = `SELECT * FROM employee WHERE first_name = '${employeeName[0]}' and last_name = '${employeeName[1]}'`;
    const getEInfo = await sequelize.query(query2, { plain: true });
    const employeeID = getEInfo.id;
    const employeeFirst = getEInfo.first_name;
    const employeeLast = getEInfo.last_name;
    const employeeRoleFull = selectRole.roleToUpdate;
    const employeeRoleID = getEInfo.role_id;
    const employeeMgrID = getEInfo.manager_id;
    const getMgrName = await sequelize.query(`SELECT CONCAT(first_name, " ", last_name) AS Manager_Name FROM employee WHERE id = ${employeeMgrID}`, { plain: true });
    const mgrName = getMgrName.Manager_Name;

    const updateEInfo = await inquirer.prompt([
        {
            type: 'confirm',
            message: `Would you like to update the employee\'s first name from ${employeeFirst}?`,
            name: 'updateFirst'
        },
        {
            type: 'input',
            message: 'What is the employee\'s new first name?',
            name: 'newFirst',
            when: (answers) => answers.updateFirst === true
        },
        {
            type: 'confirm',
            message: `Would you like to update the employee\'s last name from ${employeeLast}?`,
            name: 'updateLast'
        },
        {
            type: 'input',
            message: 'What is the employee\'s new last name?',
            name: 'newLast',
            when: (answers) => answers.updateLast === true
        },
        {
            type: 'confirm',
            message: `Would you like to update the employee\'s role from ${employeeRoleFull}?`,
            name: 'updateRole'
        },
        {
            type: 'list',
            message: 'What is the employee\'s new role?',
            choices: roleNames,
            name: 'newRole',
            when: (answers) => answers.updateRole === true
        },
    ])

    const query = `SELECT department_id FROM role WHERE role.title = '${updateEInfo.newRole}'`;
    const departmentInfo = await sequelize.query(query, { plain: true });
    const departmentID = departmentInfo.department_id;
    console.log(departmentID);

    const query6 = `SELECT CONCAT(first_name, " ", last_name) AS Managers FROM employee JOIN role ON employee.role_id = role.id WHERE role.department_id = ${departmentID}`;
    const managersInfo = await sequelize.query(query6, { raw: true });
    let chooseMgr = [];
    for(manager of managersInfo[0]) {
        chooseMgr.push(manager.Managers);
    }
    choosMgr.push('None');

    const selectMgr = await inquirer.prompt([
        {
            type: 'confirm',
            message: `Would you like to update this employee\'s manager from ${mgrName}?`,
            name: 'updateMgr'
        },
        {
            type: 'list',
            message: 'Who is this employee\'s new manager?',
            choices: chooseMgr,
            name: 'newMgr',
            when: (answers) => answers.updateMgr === true
        }
    ])

    
}