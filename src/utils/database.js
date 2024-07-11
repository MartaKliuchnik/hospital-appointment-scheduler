const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

const pool = mysql.createPool({
	host: 'localhost',
	user: 'root',
	password: process.env.DATABASE_PASSWORD,
});

const promisePool = pool.promise();

const createDatabase = async () => {
	try {
		// Create the database if it doesn't exist
		await promisePool.execute(
			'CREATE DATABASE IF NOT EXISTS hospital_appointment_scheduler'
		);

		// Use the created database
		await promisePool.query('USE hospital_appointment_scheduler');

		// Read the SQL file
		const dataSql = fs
			.readFileSync(path.join(__dirname, '..', '../schema.sql'), 'utf8')
			.toString();

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
	}
};

module.exports = {
	pool: promisePool,
	createDatabase,
};
