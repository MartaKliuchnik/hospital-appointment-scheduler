const express = require('express');
const rootDir = require('./utils/path');
const path = require('path');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/auth');

const PORT = process.env.PORT || 8080;

const app = express();

app.use(bodyParser.urlencoded());
app.use(authRoutes);

app.get('/', (req, res, next) => {
	res.sendFile(path.join(rootDir, 'views', 'home-page.html'));
});

app.use((req, res, next) => {
	res.status(404).send('<h1>Page Not Found!</h1>');
});

app.listen(PORT, () => {
	console.log(`\n\nServer started on ${PORT} port...`);
});
