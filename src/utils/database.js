const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
	host: process.env.DATABASE_HOST || 'localhost',
	user: process.env.DATABASE_USER || 'root',
	password: process.env.DATABASE_PASSWORD,
	database: process.env.DATABASE_NAME || 'hospitalAppointmentScheduler',
	timezone: 'Z',
};

// Create a pool of connections
const pool = mysql.createPool(dbConfig);
const promisePool = pool.promise();

/**
 * Reads and executes SQL commands from a file.
 * @param {string} filePath - The path to the SQL file.
 * @returns {Promise<void>}
 * @throws {Error} - Throws an error if reading or executing the SQL file fails.
 */
const executeSqlFile = async (filePath) => {
	try {
		const sql = fs.readFileSync(filePath, 'utf8');
		const commands = sql
			.split(';')
			.map((command) => command.trim())
			.filter(
				(command) =>
					command.length > 0 &&
					command.toLowerCase() !== 'null' &&
					command.toLowerCase() !== 'undefined'
			);

		for (const command of commands) {
			await promisePool.execute(command);
		}
	} catch (error) {
		// console.error('Error executing SQL file:', error.message);
		throw new Error('Failed to execute SQL file');
	}
};

/**
 * Initializes the database by creating it if it doesn't exist and setting up schema.
 * @returns {Promise<void>}
 * @throws {Error} - Throws an error if database creation or schema setup fails.
 */
const createDatabase = async () => {
	try {
		// Create the database if it doesn't exist
		await promisePool.execute(
			'CREATE DATABASE IF NOT EXISTS hospitalAppointmentScheduler'
		);

		// Use the created database
		await promisePool.query('USE hospitalAppointmentScheduler');

		// Execute SQL schema file
		const schemaFilePath = path.join(__dirname, '..', '../01-schema.sql');
		await executeSqlFile(schemaFilePath);

		console.log('Database and tables created successfully.');
	} catch (err) {
		// console.error('Error creating database and tables:', err.message);
		throw err; // Re-throw the error to ensure the server does not start if database setup fails
	}
};

module.exports = {
	pool: promisePool,
	createDatabase,
};
