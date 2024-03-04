'use strict';

const express = require('express');
const cors = require('cors');
const dao = require('./kanban_dao');
const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));


// Route per inserire dati nel DB /inserisci_task
app.post('/inserisci_task', async (req, res) => {
    try {
        const task = req.body;
        await dao.addTaskToDB(task);
        res.json({ success: true });     
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route per recuperare dati dal DB /recupera_tasks
app.get('/recupera_tasks/', async (req, res) => {
    try {
        const tasks = await dao.getTasksFromDB();
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
        await dao.updateTaskToDB(task);
        res.json({ success: true }); 
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Avvia il server
app.listen(PORT, () => {
    console.log(`Il server è in ascolto sulla porta ${PORT}`);
});
  