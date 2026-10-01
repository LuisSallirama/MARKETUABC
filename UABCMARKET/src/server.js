const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();

// Middleware para procesar JSON
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Permite peticiones desde el navegador (CORS)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Configuracion de la conexión a MySQL (Puerto 3307)
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'uabc_marketplace',
    port: 3307
});

// Comprobar la conexion con la base de datos
db.getConnection((err, connection) => {
    if (err) {
        console.error('Error al conectar a MySQL:', err.message);
    } else {
        console.log('Conexion exitosa con la base de datos MySQL');
        connection.release();
    }
});

// Ruta para registrar un usuario
app.post('/api/registro', (req, res) => {
    const { nombre, email, password, rol } = req.body;

    // validar campos requeridos
    if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'Por favor completa todos los campos requeridos.' });
    }

    // validar que el correo sea exclusivamente del dominio @uabc.edu.mx
    if (!email.toLowerCase().endsWith('@uabc.edu.mx')) {
        return res.status(400).json({ 
            error: 'Acceso denegado. Solo se permiten correos institucionales @uabc.edu.mx' 
        });
    }

    // Insertar en la base de datos si pasa las validaciones
    const query = 'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)';
    
    db.query(query, [nombre, email, password, rol || 'comprador'], (err, result) => {
        if (err) {
            // Manejo de correos duplicados si el email es UNIQUE en MySQL
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Este correo institucional ya está registrado.' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ mensaje: 'Usuario UABC registrado', id: result.insertId });
    });
});

// Iniciar el servidor en el puerto 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});