const express = require('express');
const rootDir = require('./utils/path');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/auth');

const PORT = process.env.PORT || 8080;

const app = express();

app.use(express.json()); // postman
app.use(bodyParser.urlencoded({ extended: true })); // browser
app.use(
	session({
		secret: 'bde60e6a8b6348c1c0e98d2f2', // change with crypto
		resave: false,
		saveUninitialized: false,
	})
);
app.use('/auth', authRoutes);

app.get('/', (req, res, next) => {
	res.sendFile(path.join(rootDir, 'views', 'home-page.html'));
});

app.use((req, res, next) => {
	res.status(404).send('<h1>Page Not Found!</h1>');
});

app.listen(PORT, () => {
	console.log(`\n\nServer started on ${PORT} port...`);
});
