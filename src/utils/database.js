const mysql = require('mysql2');

const pool = mysql.createPool({
	host: 'localhost',
	user: 'root',
	database: 'hospital_appointment_scheduler',
	password: process.env.DATABASE_PASSWORD,
});

pool.query('SELECT * FROM user', (err, results) => {
	if (err) {
		console.error('Error executing query:', err);
		return;
	}
	console.log('Query results:', results);
});

module.exports = pool.promise();
