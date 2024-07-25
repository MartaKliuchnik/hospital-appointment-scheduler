const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

const pool = mysql.createPool({
	host: 'localhost',
	user: 'root',
	password: process.env.DATABASE_PASSWORD,
	database: 'hospitalAppointmentScheduler',
	timezone: 'Z',
});

const promisePool = pool.promise();

const createDatabase = async () => {
	try {
		// Create the database if it doesn't exist
		await promisePool.execute(
			'CREATE DATABASE IF NOT EXISTS hospitalAppointmentScheduler'
		);

		// Use the created database
		await promisePool.query('USE hospitalAppointmentScheduler');

		// Read the SQL file
		const dataSql = fs.readFileSync(
			path.join(__dirname, '..', '../schema.sql'),
			'utf8'
		);

		// Split SQL commands by semicolon, trim whitespace, filter out empty strings, null, undefined
		const sqlCommands = dataSql
			.split(';')
			.map((command) => command.trim())
			.filter((command) => {
				return (
					command &&
					command.toLowerCase() !== 'null' &&
					command.toLowerCase() !== 'undefined' &&
					command !== ''
				);
			});

		// Execute each valid SQL command
		for (let command of sqlCommands) {
			await promisePool.execute(command);
		}

		console.log('Database and tables created successfully.');
	} catch (err) {
		console.error('Error creating database and tables:', err.message);
		throw err; // Re-throw the error to ensure the server does not start if database setup fails
	}
};

module.exports = {
	pool: promisePool,
	createDatabase,
};
