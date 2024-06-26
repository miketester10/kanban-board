'use strict';

const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy; // strategia username(email)+password
const session = require('express-session');
// const FileStore = require('session-file-store')(session);
const task_dao = require('./db/kanban_dao');
const utenti_dao = require('./db/utenti_dao');
require('dotenv').config();

/*** Uso better-sqlite3 per salvare le sessioni nel DB, anzichè 'session-file-store' ***/
const sqlite = require('better-sqlite3');
const SqliteStore = require('better-sqlite3-session-store')(session)
const sessionsDB = new sqlite('./sessions/sessions.db');

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
app.use(express.json());
app.use(express.static('public')); // configuro Express per servire i file statici dalla cartella 'public'.
/*** Middleware per verificare se l'utente è autenticato o meno quando chiama una route (serve anche a proteggere la route, in quanto se l'utente non è autenticato e prova ad accedere alla route ottiene un errore: status code "401" ed il messaggio error: Utente non autenticato!) ***/
function isLoggedIn(req, res, next) {
    // console.log(req.isAuthenticated());
    if (req.isAuthenticated()) { // controllo se sono autenticato (dopo esser stato deserializzato con passport.deserializeUser), prima di procedere con il codice presente nella route chiamante, altrimenti viene restituito un 401 Unauthorized
        console.log(`L'utente ${req.user.username} è autenticato!`);
        // console.log(req.user);
        return next();
    };
    return res.status(401).json({ error: 'Utente non autenticato!' });
};

/*** Abilito sessioni in Express (Opzione usando 'session-file-store') ***/
// app.use(session({
//     store: new FileStore(), // per salvare le sessioni in locale nella cartella sessions anzichè in memoria, così se spengo e riavvio il server, la sessione resta attiva e l'utente non deve rifare il login sulla pagina quando riavvio il server.
//     secret: process.env.SECRET // Frase segreta (posso scrivere qualsiasi cosa) da non condividere con nessuno. Serve a firmare il cookie Session ID'. La metto in una variabile d'ambiente.
//     resave: false,
//     saveUninitialized: false,
//     cookie: { sameSite: 'Lax' } // imposto sameSite a 'Lax' per limitare attacchi CSRF. Inoltre aggiungere { secure: true } per abilitare l'utilizzo dei cookie con connessioni HTTPS.
// }));

/*** Abilito sessioni in Express (Opzione usando 'better-sqlite3') ***/
app.use(session({
    store: new SqliteStore({ // per salvare le sessioni nel DB nella cartella sessions anzichè in memoria, così se spengo e riavvio il server, la sessione resta attiva e l'utente non deve rifare il login sulla pagina quando riavvio il server.
        client: sessionsDB,
    }),
    secret: process.env.SECRET, // Frase segreta (posso scrivere qualsiasi cosa) da non condividere con nessuno. Serve a firmare il cookie Session ID'. La metto in una variabile d'ambiente.
    resave: false,
    saveUninitialized: false,
    cookie: { sameSite: 'Lax' } // imposto sameSite a 'Lax' per limitare attacchi CSRF. Inoltre aggiungere { secure: true } per abilitare l'utilizzo dei cookie con connessioni HTTPS.
}));

/*** Abilito Passport per usare le sessioni ****/
app.use(passport.initialize());
app.use(passport.session());

/*** Definisco tutte le Route ***/
// Route per recuperare tutte le tasks dell'utente dal DB [METHOD = GET]
app.get('/api/v1/tasks', isLoggedIn, async (req, res) => { 
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
app.post('/api/v1/tasks/task', isLoggedIn, async (req, res) => {
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
app.put('/api/v1/tasks/task', isLoggedIn, async (req, res) => {
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
app.post('/login', passport.authenticate('local'), (req, res) => {
    // console.log(req);
    // console.log(req.user.username);
    res.json( req.user ); // dentro req.user ci sarà { id: row.id, username: row.email, name: row.nome } ovvero l'oggetto ricevuto dal DB dopo aver fatto richiesta con LocalStrategy
});

// Route per il logout [METHOD = DELETE]
app.delete('/logout', isLoggedIn, (req, res) => {
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