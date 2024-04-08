'use strict';

const fs = require('fs');
const express = require('express');
const cookieParser = require('cookie-parser');
const { verifyToken, signToken, deleteToken } = require('./middleware/user-auth');
const task_dao = require('./db/kanban_dao');
const utenti_dao = require('./db/utenti_dao');

/*** Inizializzo Express ***/
const app = express();
const PORT = 8080;

/*** Set up Middleware ***/
app.use(express.json());
app.use(express.static('public')); // configuro Express per servire i file statici dalla cartella 'public'.
app.use(cookieParser());

/*** Definisco tutte le Route ***/
// Route per recuperare tutte le tasks dell'utente dal DB [METHOD = GET]
app.get('/api/v1/tasks', verifyToken, async (req, res) => { 
    try {
        const id = req.user.id; // req.user contiene il payload del token, poichè lo abbiamo assegnato all'interno della middleware verifyToken.
        const user = req.user; 
        const tasks = await task_dao.getTasksFromDB(id);
        console.log(tasks);
        res.json({ tasks, user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    };
});

// Route per inserire la singola task nel DB [METHOD = POST]
app.post('/api/v1/tasks/task', verifyToken, async (req, res) => {
    try {
        const id = req.user.id; 
        const task = req.body;
        await task_dao.addTaskToDB(id, task);
        res.json({ success: true });     
    } catch (error) {
        res.status(500).json({ error: error.message });
    };
});

// Route per aggiornare la singola task nel DB [METHOD = PUT]
app.put('/api/v1/tasks/task', verifyToken, async (req, res) => {
    try {
        const task = req.body;
        await task_dao.updateTaskToDB(task);
        res.json({ success: true }); 
    } catch (error) {
        res.status(500).json({ error: error.message });
    };
});

// Route per la registrazione utente [METHOD = POST]
app.post('/iscrizione', async (req, res) => {
    try {
        const user = req.body;
        console.log(user);
        await utenti_dao.addUserToDB(user);
        res.json({ success: true });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            res.status(409).json({ error: 'Email già registrata!' });
        } else {
            res.status(500).json({ error: error.message });
        };
    };  
});

// Route per il login/autenticazione [METHOD = POST]
app.post('/login', signToken, (req, res) => {
    // Effetta il login dell'utente e crea il cookie di autenticazione, medante il middleware signToken.
});

// Route per il logout [METHOD = DELETE]
app.delete('/logout', deleteToken, (req, res) => {
    // Effettua il logout dell'utente e rimuovi il cookie di autenticazione, mediante il middleware deleteToken.
});

/*** Avvio del server ***/
app.listen(PORT, () => {
    console.log(`Il server è in ascolto sulla porta ${PORT}`);
});  