const { pool } = require('../utils/database');

module.exports = class Appointment {
	constructor(clientId, doctorId, appointmentTime) {
		this.clientId = clientId;
		this.doctorId = doctorId;
		this.appointmentTime = appointmentTime;
		this.appointmentStatus = 'SCHEDULED';
	}

	/**
	 * Insert a new appointment into the database.
	 * @returns {Promise<number>} - A promise that resolves to the ID of the newly created appointment.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	async insertAppointment() {
		const queryCreateAppointment =
			'INSERT INTO appointment (clientId, doctorId, appointmentTime, appointmentStatus) VALUES (?, ?, ?, ?)';

		try {
			const [result] = await pool.execute(queryCreateAppointment, [
				this.clientId,
				this.doctorId,
				this.appointmentTime,
				this.appointmentStatus,
			]);

			return result.insertId;
		} catch (error) {
			console.error('Error inserting appointment:', error);
			throw new Error('Failed to insert appointment');
		}
	}

	/**
	 * Retrieve an appointment from the database by ID.
	 * @param {number} appointmentId - The ID of the appointment to retrieve.
	 * @returns {Promise<Object>} - A promise that resolves to the retrieved appointment.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	async getAppointmentById(appointmentId) {
		const querySelectAppointment =
			'SELECT * FROM appointment WHERE appointmentId = ?';

		try {
			const [result] = await pool.execute(querySelectAppointment, [
				appointmentId,
			]);

			return result[0];
		} catch (error) {
			console.error('Error retrieving appointment:', error);
			throw new Error('Failed to retrieve appointment');
		}
	}

	/**
	 * Validate the appointment time.
	 * @returns {boolean} - Returns true if the appointment time is in the future; false otherwise.
	 */
	isValidAppointmentTime() {
		const currentData = new Date();
		const appointmentDate = new Date(this.appointmentTime.replace(' ', 'T'));
		return appointmentDate > currentData;
	}
};
