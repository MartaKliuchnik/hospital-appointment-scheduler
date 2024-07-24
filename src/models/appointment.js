const { pool } = require('../utils/database');

module.exports = class Appointment {
	/**
	 * @param {number} clientId - The ID of the client.
	 * @param {number} doctorId - The ID of the doctor.
	 * @param {string} appointmentTime - The time for appointment.
	 */
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

			this.appointmentId = result.insertId;
			return this.appointmentId;
		} catch (error) {
			console.error('Error inserting appointment:', error);
			throw new Error('Failed to insert appointment.');
		}
	}

	/**
	 * Retrieve an appointment from the database by ID.
	 * @param {number} appointmentId - The ID of the appointment to retrieve.
	 * @returns {Promise<Object|null>} - A promise that resolves to the retrieved appointment, or null if not found.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	static async getAppointmentById(appointmentId) {
		const querySelectAppointment =
			'SELECT * FROM appointment WHERE appointmentId = ?';

		try {
			const [results] = await pool.execute(querySelectAppointment, [
				appointmentId,
			]);

			return results.length > 0 ? results[0] : null;
		} catch (error) {
			console.error('Error retrieving appointment:', error);
			throw new Error('Failed to retrieve appointment.');
		}
	}

	/**
	 * Validate the appointment time.
	 * @returns {boolean} - Returns true if the appointment time is in the future; false otherwise.
	 */
	static isValidAppointmentTime(appointmentTime) {
		const currentData = new Date();
		const appointmentDate = new Date(appointmentTime.replace(' ', 'T') + 'Z');
		return appointmentDate > currentData;
	}

	/**
	 * Format the appointment response.
	 * @param {Object} appointment - The appointment object to format.
	 * @returns {Object} - The formatteds appointment object.
	 */
	static formatAppointmentResponse(appointment) {
		return {
			...appointment,
			appointmentTime: new Date(appointment.appointmentTime + 'Z')
				.toISOString()
				.replace('T', ' ')
				.substring(0, 19),
		};
	}

	/**
	 * Retrieve all appointments for a client from the database.
	 * @param {number} clientId - The ID of the client.
	 * @returns {Promise<Array>} - A promise that resolves to an array of appointments.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	static async getAppointmentsByClientId(clientId) {
		const querySelectClientAppointments =
			'SELECT * FROM appointment WHERE clientId = ?';

		try {
			const [results] = await pool.execute(querySelectClientAppointments, [
				clientId,
			]);

			return {
				clientId: clientId,
				appointments: results,
			};
		} catch (error) {
			console.error('Error retrieving client appointments:', error);
			throw new Error('Failed to retrieve client appointments.');
		}
	}

	/**
	 * Delete an appointment from the database by ID.
	 * @param {number} appointmentId - The ID of the appointment.
	 * @returns {Promise<undefined>}
	 * @throws {Error} - If there's an error during the database operation.
	 */
	static async deleteAppointmentById(appointmentId) {
		const queryDeleteAppointment =
			'DELETE FROM appointment WHERE appointmentId = ?';

		try {
			const [result] = await pool.execute(queryDeleteAppointment, [
				appointmentId,
			]);

			if ((result.affectedRows = 0)) {
				throw new Eror('Appointment not found.');
			}
		} catch (error) {
			console.error('Error deleting client appointment:', error);
			throw new Error('Failed to delete appointment.');
		}
	}

	/**
	 * Change an appointment.
	 * @param {number} appointmentId - The ID of the appointment.
	 * @returns {Promise<Object>} - A promise that resolves to the updated appointment.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	static async changeAppointmentById(newAppointmentTime, appointmentId) {
		const connection = await pool.getConnection();

		try {
			await connection.beginTransaction();

			const queryChangeAppointment =
				'UPDATE appointment SET appointmentTime = ? WHERE appointmentId = ?';

			const [result] = await connection.execute(queryChangeAppointment, [
				newAppointmentTime,
				appointmentId,
			]);

			if ((result.changedRows = 0)) {
				throw new Eror('Appointment not found.');
			}

			await connection.commit();
		} catch (error) {
			await connection.rollback();
			console.error('Error changing client appointment:', error);
			throw new Error('Failed to update appointment.');
		} finally {
			connection.release();
		}
	}
};
