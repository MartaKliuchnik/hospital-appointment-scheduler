const express = require('express');
const path = require('path');
const session = require('express-session');
const crypto = require('crypto');
require('dotenv').config();

const authMiddleware = require('./middleware/auth');

const rootDir = require('./utils/path');
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const doctorRoutes = require('./routes/doctors');
const adminRoutes = require('./routes/admin');
const scheduleRoutes = require('./routes/schedule');
const { createDatabase } = require('./utils/database');

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

// Apply the authentication middleware to all routes defined below this line.
app.use(authMiddleware.checkAuth);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/clients', adminRoutes);
app.use('/api/v1/schedules', scheduleRoutes);

app.get('/api/v1/welcome-page', (req, res) => {
	res.sendFile(path.join(rootDir, '../views', 'home-page.html'));
});

// Error handling middleware
app.use((req, res) => {
	res.status(404).send('<h1>Page Not Found!</h1>');
});

const startServer = async () => {
	try {
		// Ensure the database is created
		await createDatabase();

		// Start the server
		app.listen(PORT, () => {
			console.log(`\n\nServer started on ${PORT} port...`);
		});
	} catch (err) {
		console.error('Failed to start server:', err.message);
		process.exit(1); // Exit the process if database setup fails
	}
};

// Start the server
startServer();
