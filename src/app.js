const express = require('express');
const path = require('path');
const session = require('express-session');
const crypto = require('crypto');
require('dotenv').config();

const rootDir = require('./utils/path');
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const { createDatabase, pool } = require('./utils/database');

const app = express();
const PORT = process.env.PORT || 8080;
const sessionSecret =
	process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex');

// Middleware
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(
	session({
		secret: sessionSecret,
		resave: false,
		saveUninitialized: false,
	})
);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/appointments', appointmentRoutes);

app.get('/api/v1/welcome-page', (req, res) => {
	res.sendFile(path.join(rootDir, '../views', 'home-page.html'));
});

// Error handling middleware
app.use((req, res) => {
	res.status(404).send('<h1>Page Not Found!</h1>');
});

// Run database creation script
createDatabase().then((res) => {
	// Server start
	app.listen(PORT, () => {
		console.log(`\n\nServer started on ${PORT} port...`);
	});
});
