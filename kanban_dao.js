'use strict';

const sqlite = require('sqlite3');

const db = new sqlite.Database('kanban.db', (err) => { if (err) throw err; });

function addTaskToDB(task) {
    
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO tasks (descrizioneTask, colonna) VALUES (?,?)';
        db.run(sql, [task.descrizioneTask, task.colonna], function (err) {
            if (!err) { // se l'inserimento va a buon fine quindi !err (! significa not), ovvero non ci sono errori, err è una variabile vuota se non ci sono errori quindi not false
                resolve();
                // console.log('debug');
            } else {
                reject(err);
            }
        });
    });
};

function getTasksFromDB() {
    const db = new sqlite.Database('kanban.db', (err) => { if (err) throw err; });
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM tasks';
        db.all(sql, [], (err, rows) => {
            if (!err) {
                let tasks = rows
                resolve(tasks); 
            } else {
                reject(err);
            }        
        });
    });  
};

function updateTaskToDB(task) {
    const db = new sqlite.Database('kanban.db', (err) => { if (err) throw err; });
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE tasks SET colonna = ? WHERE id = ?';
        db.run(sql, [task.colonna, task.id], function (err) {
            if (!err) {
                resolve();
            } else {
                reject(err);
            }
        });
    });
};

exports.addTaskToDB = addTaskToDB;
exports.getTasksFromDB = getTasksFromDB;
exports.updateTaskToDB = updateTaskToDB;