'use strict';

const express = require('express');
const cors = require('cors');
const sqlite = require('sqlite3');
const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

async function addTaskToDB(task) {
    const db = new sqlite.Database('kanban.db', (err) => { if (err) throw err; });
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

async function getTasksFromDB() {
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

async function updateTaskToDB(task) {
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

// Route per inserire dati nel DB /inserisci_task
app.post('/inserisci_task', async (req, res) => {
    try {
        const task = req.body;
        await addTaskToDB(task);
        res.json({ success: true});     
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route per recuperare dati dal DB /recupera_tasks
app.get('/recupera_tasks/', async (req, res) => {
    try {
        const tasks = await getTasksFromDB();
        console.log(tasks);
        res.json({ tasks });    
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route per aggiornare dati nel DB /aggiorna_task
app.post('/aggiorna_task', async (req, res) => {
    try {
        const task = req.body;
        await updateTaskToDB(task);
        res.json({ success: true }); 
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Avvia il server
app.listen(PORT, () => {
    console.log(`Il server è in ascolto sulla porta ${PORT}`);
});
  