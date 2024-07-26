const express = require('express');
const path = require('path');
require('dotenv').config();

const authMiddleware = require('./middleware/auth');

const rootDir = require('./utils/path');
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const doctorRoutes = require('./routes/doctors');
const adminRoutes = require('./routes/admin');
const scheduleRoutes = require('./routes/schedule');
const { createDatabase } = require('./utils/database');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json()); // For parsing application/json

// Apply the authentication middleware to all routes defined below this line.
app.use(authMiddleware.checkAuth);

// Route setup
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/clients', adminRoutes);
app.use('/api/v1/schedules', scheduleRoutes);

app.get('/api/v1/welcome-page', (req, res) => {
	res.sendFile(path.join(rootDir, '../views', 'home-page.html'));
});

// Global error handling middleware
app.use(errorHandler);

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
