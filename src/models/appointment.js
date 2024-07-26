const { pool } = require('../utils/database');
const Schedule = require('./schedule');
const {
	ValidationError,
	NotFoundError,
	DatabaseError,
} = require('../utils/customErrors');

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
		const appointmentTime = new Date(this.appointmentTime + 'Z');

		// Start a transaction
		const connection = await pool.getConnection();
		await connection.beginTransaction();

		try {
			// Check if the appointment time is available
			const isAvailable = await Appointment.isTimeSlotAvailable(
				this.doctorId,
				appointmentTime,
				connection
			);

			if (!isAvailable) {
				throw new ValidationError(
					'The selected appointment time is not available.'
				);
			}

			const queryCreateAppointment =
				'INSERT INTO appointment (clientId, doctorId, appointmentTime, appointmentStatus) VALUES (?, ?, ?, ?)';

			const [result] = await connection.execute(queryCreateAppointment, [
				this.clientId,
				this.doctorId,
				appointmentTime,
				this.appointmentStatus,
			]);

			this.appointmentId = result.insertId;

			// Commit the transaction
			await connection.commit();
			return this.appointmentId;
		} catch (error) {
			// If there's an error, roll back the transaction
			await connection.rollback();
			console.error('Error inserting appointment:', error);
			throw new DatabaseError('Failed to insert appointment.', error);
		} finally {
			connection.release();
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
			throw new DatabaseError('Failed to retrieve appointment.', error);
		}
	}

	/**
	 * Validate the appointment time.
	 * @param {string} appointmentTime - The appointment time to validate.
	 * @returns {boolean} - Returns true if the appointment time is in the future; false otherwise.
	 */
	static isValidAppointmentTime(appointmentTime) {
		const currentDate = new Date();
		const appointmentDate = new Date(appointmentTime);
		return appointmentDate > currentDate;
	}

	/**
	 * Format the appointment response.
	 * @param {Object} appointment - The appointment object to format.
	 * @returns {Object} - The formatted appointment object.
	 */
	static formatAppointmentResponse(appointment) {
		return {
			...appointment,
			appointmentTime: new Date(appointment.appointmentTime)
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
			throw new DatabaseError('Failed to retrieve client appointments.', error);
		}
	}

	/**
	 * Delete or cancel an appointment based on client role.
	 * @param {number} appointmentId - The ID of the appointment.
	 * @param {string} clientRole - The role of the client.
	 * @returns {Promise<void>}
	 * @throws {Error} - If there's an error during the database operation.
	 */
	static async deleteAppointmentById(appointmentId, clientRole) {
		const connection = await pool.getConnection();

		try {
			await connection.beginTransaction();

			if (clientRole === 'ADMIN') {
				const queryDeleteAppointment =
					'DELETE FROM appointment WHERE appointmentId = ?';

				const [result] = await connection.execute(queryDeleteAppointment, [
					appointmentId,
				]);

				if (result.affectedRows === 0) {
					throw new NotFoundError('Appointment not found.');
				}
			} else {
				const queryCancelAppointment = `
                UPDATE appointment 
                SET appointmentStatus = 'CANCELED' 
                WHERE appointmentId = ?`;

				const [result] = await connection.execute(queryCancelAppointment, [
					appointmentId,
				]);

				if (result.affectedRows === 0) {
					throw new NotFoundError('Appointment not found.');
				}
			}
			await connection.commit();
		} catch (error) {
			await connection.rollback();
			console.error('Error deleting appointment:', error);
			throw new DatabaseError('Failed to delete appointment.', error);
		} finally {
			connection.release();
		}
	}

	/**
	 * Change an appointment time.
	 * @param {string} newAppointmentTime - The new appointment time.
	 * @param {number} appointmentId - The ID of the appointment to change.
	 * @returns {Promise<Object>} - A promise that resolves to the updated appointment.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	static async changeAppointmentById(newAppointmentTime, appointmentId) {
		const connection = await pool.getConnection();

		try {
			await connection.beginTransaction();

			// Get the current appointment details
			const currentAppointment = await this.getAppointmentById(appointmentId);
			if (!currentAppointment) {
				throw new NotFoundError('Appointment not found.');
			}

			// Check if the new time slot is available
			const isAvailable = await this.isTimeSlotAvailable(
				currentAppointment.doctorId,
				new Date(newAppointmentTime + 'Z'),
				connection
			);

			if (!isAvailable) {
				throw new ValidationError(
					'The selected appointment time is not available.'
				);
			}

			const queryChangeAppointment =
				'UPDATE appointment SET appointmentTime = ? WHERE appointmentId = ?';

			const [result] = await connection.execute(queryChangeAppointment, [
				newAppointmentTime,
				appointmentId,
			]);

			if (result.changedRows === 0) {
				throw new Error('No changes were made to the appointment.');
			}

			await connection.commit();
			return await this.getAppointmentById(appointmentId);
		} catch (error) {
			await connection.rollback();
			console.error('Error changing client appointment:', error);
			throw new DatabaseError('Failed to change appointment.', error);
		} finally {
			connection.release();
		}
	}

	/**
	 * Retrieve all appointments for a specific doctor and date.
	 * @param {number} doctorId - The ID of the doctor.
	 * @param {string} date - The date to retrieve appointments for.
	 * @returns {Promise<Array>} - A promise that resolves to an array of appointments.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	static async getAppointmentsByDoctorAndDate(doctorId, date) {
		const queryGetAppointments =
			'SELECT * FROM appointment WHERE doctorId = ? AND DATE(appointmentTime) = DATE(?)';

		try {
			const [results] = await pool.execute(queryGetAppointments, [
				doctorId,
				date,
			]);

			return results;
		} catch (error) {
			console.error('Error retrieving appointments:', error);
			throw new DatabaseError('Failed to retrieve appointments.', error);
		}
	}

	/**
	 * Check if a time slot is available.
	 * @param {number} doctorId - The ID of the doctor.
	 * @param {Date} appointmentTime - The time of the appointment.
	 * @param {object} connection - The database connection to use.
	 * @returns {Promise<boolean>} - A promise that resolves to true if the time slot is available, false otherwise.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	static async isTimeSlotAvailable(doctorId, appointmentTime, connection) {
		const date = appointmentTime.toISOString().split('T')[0];
		const appointmentTimeString = appointmentTime
			.toISOString()
			.slice(0, 19)
			.replace('T', ' ');

		const queryCheckOverlap = `
			SELECT COUNT(*) as count 
			FROM appointment 
			WHERE doctorId = ? 
			AND DATE(appointmentTime) = DATE(?)
			AND ABS(TIMESTAMPDIFF(MINUTE, appointmentTime, ?)) < 20
			FOR UPDATE`;

		try {
			const [results] = await connection.execute(queryCheckOverlap, [
				doctorId,
				date,
				appointmentTimeString,
			]);

			if (results[0].count > 0) {
				return false; // Overlapping appointment found
			}

			// If no overlap, check if it's within the doctor's schedule
			const availableSlots = await Schedule.getAvailableTimeSlots(
				doctorId,
				date,
				Appointment.getAppointmentsByDoctorAndDate
			);

			return availableSlots.some(
				(slot) => Math.abs(slot.getTime() - appointmentTime.getTime()) < 1000
			);
		} catch (error) {
			console.error('Error checking time slot availability:', error);
			throw new DatabaseError('Failed to check time slot availability.', error);
		}
	}
};
