'use strict';

const fs = require('fs');
const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const task_dao = require('./db/kanban_dao');
const utenti_dao = require('./db/utenti_dao');
require('dotenv').config();


/*** Inizializzo Express ***/
const app = express();
const PORT = 8080;

/*** JWT options ***/
const option = { expiresIn: '1h', algorithm: 'RS256' };

/*** Set up Middleware ***/
app.use(express.json());
app.use(express.static('public')); // configuro Express per servire i file statici dalla cartella 'public'.
app.use(cookieParser());

/*** Definisco tutte le Route ***/
// Route per recuperare tutte le tasks dell'utente dal DB [METHOD = GET]
app.get('/api/v1/tasks', async (req, res) => { 
    try {
        const token = req.cookies.token;
        const pub_key = fs.readFileSync('./key/rsa.public', 'utf8');
        if (!token) return res.status(401).json({ error: 'Utente non autenticato!' });
        const payload = jwt.verify(token, pub_key, option);
        console.log(payload);
        const id = payload.id;
        const user = payload; 
        const tasks = await task_dao.getTasksFromDB(id);
        console.log(tasks);
        res.json({ tasks, user });    
    } catch (error) {
        if (error.message.includes('jwt expired') || error.message.includes('invalid signature')) {
            res.status(401).json({ error: 'Utente non autenticato! Token scaduto o non valido.' });
        } else {
            res.status(500).json({ error: error.message });
        };
    };
});

// Route per inserire la singola task nel DB [METHOD = POST]
app.post('/api/v1/tasks/task', async (req, res) => {
    try {
        const id = req.user.id; // req.user contiene l'oggetto user creato con deserializeUser se il login andato a buon fine
        const task = req.body;
        await task_dao.addTaskToDB(id, task);
        res.json({ success: true });     
    } catch (error) {
        res.status(500).json({ error: error.message });
    };
});

// Route per aggiornare la singola task nel DB [METHOD = PUT]
app.put('/api/v1/tasks/task', async (req, res) => {
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
app.post('/login', async (req, res) => {
    try {
        const email = req.body.username;
        const password = req.body.password;
        const user = await utenti_dao.getUserFromDBbyEmail(email, password);
        console.log(user);
        if (!user) return res.status(401).json({ error: 'Email o password errata!' });
        const payload = { id: user.id, nome: user.nome };
        const cookieOption = { 
            expire: new Date(Date.now() + 3600000), 
            httpOnly: true, 
            secure: false // Aggiungere { secure: true } per abilitare l'utilizzo dei cookie con connessioni HTTPS.
        };
        const prv_key = fs.readFileSync('./key/rsa.private');
        const token = jwt.sign(payload, prv_key, option);
        res.cookie('token', token, cookieOption).json(user); 
    } catch (error) {
        res.status(500).json({ error: error.message });
    };
});

// Route per il logout [METHOD = DELETE]
app.delete('/logout', (req, res) => {
    // Effettua il logout dell'utente
    req.logout((err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Errore durante il logout' });
      } else {
        console.log('Logout effettuato con successo!');
        req.session.destroy((err) => err ? console.error(err) : res.end()); // Elimina la sessione corrente dal DB
      };
    });
});

/*** Avvio del server ***/
app.listen(PORT, () => {
    console.log(`Il server è in ascolto sulla porta ${PORT}`);
});  