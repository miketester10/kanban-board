'use strict';

const express = require('express');
const cors = require('cors');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy; // strategia username(email)+password
const session = require('express-session');
const task_dao = require('./kanban_dao');
const utenti_dao = require('./utenti_dao');

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

passport.serializeUser(function (user, done) { // il contenuto di user viene preso dall'oggetto req.user in automatico, se il login è andato a buon fine)
    // console.log(user);
    done(null, user.id); // viene serializzato l'id dell'utente
});

passport.deserializeUser(function (id, done) { // il contenuto di id viene preso da user.id
    console.log(`L'id dell'utente in sessione è: ${id}`);
    utenti_dao.getUserFromDBbyID(id).then((user) => {
        done(null, user); // viene salvato l'oggetto user nel req.user delle routes autenticate (quelle con isLoggedIn)
    }).catch((err) => {
        done(null, err);
    });
});

/*** Inizializzo Express ***/
const app = express();
const PORT = 8080;

/*** Set up Middleware ***/
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

/*** Abilito sessioni in Express ***/
app.use(session({
    secret: 'Frase segreta (posso scrivere qualsiasi cosa) da non condividere con nessuno. Serve a firmare il cookie Session ID',
    resave: false,
    saveUninitialized: false
}));

/*** Verifico se l'utente è autenticato quando chiama una route ***/
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        console.log(`L'utente ${req.user.username} è autenticato!`);
        // console.log(req.user);
        return next();
    };
    return res.status(401).json({ error: 'Utente non autenticato!' });
};

/*** Abilito Passport per usare le sessioni ****/
app.use(passport.initialize());
app.use(passport.session());

/*** Definisco tutte le Route ***/
// Route per inserire dati nel DB /inserisci_task
app.post('/inserisci_task', isLoggedIn, async (req, res) => {
    try {
        const task = req.body;
        await task_dao.addTaskToDB(task);
        res.json({ success: true });     
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route per recuperare dati dal DB /recupera_tasks
app.get('/recupera_tasks/', isLoggedIn,async (req, res) => {
    try {
        const id = req.user.id; // req.user contiene l'oggetto user creato con deserializeUser se il login andato a buon fine
        const tasks = await task_dao.getTasksFromDB(id);
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
        await task_dao.updateTaskToDB(task);
        res.json({ success: true }); 
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route per l'autenticazione
app.post('/login', passport.authenticate('local'), (req, res) => {
    // console.log(req);
    // console.log(req.user.username);
    res.json( req.user ); // dentro req.user ci sarà { id: row.id, username: row.email, name: row.nome } ovvero l'oggetto ricevuto dal db dopo aver fatto richiesta con LocalStrategy
});

/*** Avvio del server ***/
app.listen(PORT, () => {
    console.log(`Il server è in ascolto sulla porta ${PORT}`);
});
  