'use strict';

const sqlite = require('sqlite3');

const db = new sqlite.Database('kanban.db', (err) => { if (err) throw err; });

function addTaskToDB(id, task) {
    
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO tasks (descrizioneTask, colonna, id_user) VALUES (?,?,?)';
        db.run(sql, [task.descrizioneTask, task.colonna, id], function (err) {
            if (!err) { // se l'inserimento va a buon fine quindi !err (! significa not), ovvero non ci sono errori, err è una variabile vuota se non ci sono errori quindi not false
                resolve();
                // console.log('debug');
            } else {
                reject(err);
            }
        });
    });
};

function getTasksFromDB(id) {

    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM tasks WHERE id_user = ?';
        db.all(sql, [id], (err, rows) => {
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
    
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE tasks SET colonna = ? WHERE id_task = ?';
        db.run(sql, [task.colonna, task.id_task], function (err) {
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