const fs = require('fs');
const jwt = require('jsonwebtoken');
const utenti_dao = require('../db/utenti_dao');

/*** JWT options ***/
const jwtOptions = { expiresIn: '1h', algorithm: 'RS256' };

function verifyToken(req, res, next) {
  try {
      const token = req.cookies.token;
      const pub_key = fs.readFileSync('./key/rsa.public', 'utf8');
      if (!token) return res.status(401).json({ error: 'Utente non autenticato!' });
      const payload = jwt.verify(token, pub_key, jwtOptions);
      req.user = payload;
      next();
  } catch (error) {
      if (error.message.includes('jwt expired') || error.message.includes('invalid signature')) {
          res.status(401).json({ error: 'Utente non autenticato! Token scaduto o non valido.' });
      } else {
          res.status(500).json({ error: error.message });
      };
  };
};

async function signToken(req, res, next) {
  try {
      const email = req.body.username;
      const password = req.body.password;
      const user = await utenti_dao.getUserFromDBbyEmail(email, password);
      console.log(user);
      if (!user) return res.status(401).json({ error: 'Email o password errata!' });
      const payload = { id: user.id, nome: user.nome };
      const cookieOptions = { 
          expire: new Date(Date.now() + 3600000), // Il tempo va espresso in millisecondi quindi 1h (scadenza del token) = 3600000ms (scadenza del cookie).
          httpOnly: true, 
          secure: false, // Impostare { secure: true } per abilitare l'utilizzo dei cookie con connessioni HTTPS.
          sameSite: 'Lax' // Imposto sameSite a 'Lax' per limitare attacchi CSRF.
      };
      const prv_key = fs.readFileSync('./key/rsa.private');
      const token = jwt.sign(payload, prv_key, jwtOptions);
      res.cookie('token', token, cookieOptions).json(user); 
  } catch (error) {
      res.status(500).json({ error: error.message });
  };
};

function deleteToken(req, res, next) {
  // TO DO
};

module.exports = { 
  verifyToken, 
  signToken, 
  deleteToken 
};