'use strict';

const express = require('express');
const cors = require('cors');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy; // strategia username(email)+password
const session = require('express-session');
const FileStore = require('session-file-store')(session); 
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

/*** Abilito sessioni in Express ***/
app.use(session({
    store: new FileStore(), // per salvare le sessioni in locale nella cartella sessions anzichè in memoria, così se spengo e riavvio il server, la sessione resta attiva e l'utente non deve rifare il login sulla pagina quando riavvio il server.
    secret: 'Frase segreta (posso scrivere qualsiasi cosa) da non condividere con nessuno. Serve a firmare il cookie Session ID',
    resave: false,
    saveUninitialized: false
}));

/*** Abilito Passport per usare le sessioni ****/
app.use(passport.initialize());
app.use(passport.session());

/*** Definisco tutte le Route ***/
// Route per inserire dati nel DB /inserisci_task
app.post('/inserisci_task', isLoggedIn, async (req, res) => {
    try {
        const id = req.user.id; // req.user contiene l'oggetto user creato con deserializeUser se il login andato a buon fine
        const task = req.body;
        await task_dao.addTaskToDB(id, task);
        res.json({ success: true });     
    } catch (error) {
        res.status(500).json({ error: error.message });
    };
});

// Route per recuperare dati dal DB /recupera_tasks
app.get('/recupera_tasks/', isLoggedIn, async (req, res) => { 
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

// Route per aggiornare dati nel DB /aggiorna_task
app.post('/aggiorna_task', isLoggedIn, async (req, res) => {
    try {
        const task = req.body;
        await task_dao.updateTaskToDB(task);
        res.json({ success: true }); 
    } catch (error) {
        res.status(500).json({ error: error.message });
    };
});

// Route per la registrazione utente
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

// Route per il login/autenticazione
app.post('/login', passport.authenticate('local'), (req, res) => {
    // console.log(req);
    // console.log(req.user.username);
    res.json( req.user ); // dentro req.user ci sarà { id: row.id, username: row.email, name: row.nome } ovvero l'oggetto ricevuto dal db dopo aver fatto richiesta con LocalStrategy
});

// Route per il logout
app.get('/logout', isLoggedIn, (req, res) => {
    // Effettua il logout dell'utente
    req.logout((err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Errore durante il logout' });
      } else {
        console.log('Logout effettuato con successo!');
        res.end();
      };
    });
});

/*** Avvio del server ***/
app.listen(PORT, () => {
    console.log(`Il server è in ascolto sulla porta ${PORT}`);
}); 
  