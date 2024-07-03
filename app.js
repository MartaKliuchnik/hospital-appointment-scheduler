const express = require('express');
const rootDir = require('./utils/path');
const path = require('path');

const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');

const PORT = process.env.PORT || 8080;

const app = express();

app.use(express.json()); // postman
app.use('/', authRoutes); // OAuth
app.use('/appointments', appointmentRoutes);

app.get('/welcome-page', (req, res) => {
	res.sendFile(path.join(rootDir, 'views', 'home-page.html'));
});

app.use((req, res) => {
	res.status(404).send('<h1>Page Not Found!</h1>');
});

app.listen(PORT, () => {
	console.log(`\n\nServer started on ${PORT} port...`);
});
