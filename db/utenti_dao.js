'use strict';

const sqlite = require('sqlite3');
const bcrypt = require('bcrypt');

const db = new sqlite.Database('./db/kanban.db', (err) => { if (err) throw err; });

function addUserToDB(user) {
    user.password = bcrypt.hashSync(user.password, 10);
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO users (email, password, nome, cognome) VALUES (?,?,?,?)';
        db.run(sql, [user.email, user.password, user.nome, user.cognome], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

function getUserFromDBbyEmail(email, password) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM users WHERE email = ?';
        db.get(sql, [email], (err, row) => {
            if (err) { // errore durante la query
                reject(err);
            } else if (row === undefined) { // user non trovato (ovvero email non trovata nel db)
                resolve(false);
            } else { // user trovato (ovvero email trovata nel db)
                const user = { id: row.id, username: row.email, nome: row.nome };

                bcrypt.compare(password, row.password).then((result) => {
                    if (result) { // password corretta
                        resolve(user);
                    } else { // password errata
                        resolve(false);
                    }
                });
            }
        });
    });
};

function getUserFromDBbyID(id) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM users WHERE id = ?';
        db.get(sql, [id], (err, row) => {
            if (err) {
                reject(err);
            } else {
                const user = { id: row.id, username: row.email, nome: row.nome, cognome: row.cognome };
                resolve(user);
            }
        });
    });
};

exports.addUserToDB = addUserToDB;
exports.getUserFromDBbyEmail = getUserFromDBbyEmail;
exports.getUserFromDBbyID = getUserFromDBbyID;