'use strict';

const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy; // strategia username(email)+password
const task_dao = require('./db/kanban_dao');
const utenti_dao = require('./db/utenti_dao');
require('dotenv').config();

/*** Set up Passport ***/
passport.use(new LocalStrategy(
    function (username, password, done) {
        console.log( `*** email: ${username}, password: ${password} ***`);
        utenti_dao.getUserFromDBbyEmail(username, password).then((user) => {
            
            if (!user) {
                console.log('Email o password errata!');
                return done(null, false); // mettendo false restituisce uno status code 401 Unauthorized
            } else {
                console.log('Login effettuato con successo!');
                return done(null, user); // restituisce l'oggetto user alla route 
            }
        
        }).catch((err) => {
            console.error('Errore catturato: ', err);
            return done(null, false); // mettendo false restituisce uno status code 401 Unauthorized
        });
}));

/*** Inizializzo Express ***/
const app = express();
const PORT = 8080;

/*** Set up Middleware ***/
app.use(express.json());
app.use(express.static('public')); // configuro Express per servire i file statici dalla cartella 'public'.

/*** Abilito Passport per usare le sessioni ****/
app.use(passport.initialize());
app.use(passport.session());

/*** Definisco tutte le Route ***/
// Route per recuperare tutte le tasks dell'utente dal DB [METHOD = GET]
app.get('/api/v1/tasks', async (req, res) => { 
    try {
        const user = req.user; // req.user contiene l'oggetto user creato con deserializeUser se il login è andato a buon fine
        const id = user.id; 
        const tasks = await task_dao.getTasksFromDB(id);
        console.log(tasks);
        res.json({ tasks, user });    
    } catch (error) {
        res.status(500).json({ error: error.message });
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
app.post('/login', (req, res) => {
    // console.log(req);
    // console.log(req.user.username);
    res.json( req.user ); // dentro req.user ci sarà { id: row.id, username: row.email, name: row.nome } ovvero l'oggetto ricevuto dal DB dopo aver fatto richiesta con LocalStrategy
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