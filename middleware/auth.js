const jwt = require('jsonwebtoken');
const SECRET_KEY = 'your_secret_key'; // Asegúrate de que coincida con la clave en `auth.js`

// Middleware para verificar el token
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No se proporcionó token' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
}

// Middleware para verificar el rol del usuario
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    next();
  };
}

module.exports = { authenticateToken, authorizeRoles };