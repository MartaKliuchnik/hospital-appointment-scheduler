const { pool } = require('../utils/database');
const Schedule = require('./schedule');
const Status = require('../enums/Status');
const {
	ValidationError,
	NotFoundError,
	DatabaseError,
} = require('../utils/customErrors');
const { sendErrorResponse } = require('../utils/responseHandlers');

module.exports = class Appointment {
	/**
	 * @param {number} clientId - The ID of the client.
	 * @param {number} doctorId - The ID of the doctor.
	 * @param {string} appointmentTime - The scheduled time for the appointment, in a format compatible with the database (e.g., 'YYYY-MM-DD HH:MM:SS').
	 * @param {Date|null} [deletedAt=null] - The timestamp indicating when the appointment was deleted, if applicable. Defaults to null for non-deleted appointments.
	 */
	constructor(clientId, doctorId, appointmentTime, deletedAt = null) {
		this.clientId = clientId;
		this.doctorId = doctorId;
		this.appointmentTime = appointmentTime;
		this.appointmentStatus = Status.SCHEDULED;
		this.deletedAt = deletedAt;
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
			throw error;
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
			throw error;
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
	static async getAppointmentsByClientId(clientId, clientRole) {
		const queryAllClientAppointments =
			'SELECT * FROM appointment WHERE clientId = ? ORDER BY appointmentTime ASC';

		const queryAvailableClientAppointments =
			'SELECT * FROM appointment WHERE clientId = ? AND deletedAt IS NULL ORDER BY appointmentTime ASC';

		let results;
		try {
			if (clientRole === 'PATIENT') {
				[results] = await pool.execute(queryAvailableClientAppointments, [
					clientId,
				]);
			} else {
				[results] = await pool.execute(queryAllClientAppointments, [clientId]);
			}

			return {
				clientId: clientId,
				appointments: results,
			};
		} catch (error) {
			console.error('Error retrieving client appointments:', error);
			throw error;
		}
	}

	/**
	 * Soft deletes an appointment by marking it as deleted in the database.
	 * @param {number} appointmentId - The ID of the appointment to be soft deleted.
	 * @param {object} connection - The database connection object used for executing the query.
	 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	static async softDeleteAppointment(appointmentId, connection) {
		const querySoftDeleteAppointment =
			'UPDATE appointment SET deletedAt = NOW() WHERE appointmentId = ?';

		try {
			const [result] = await connection.execute(querySoftDeleteAppointment, [
				appointmentId,
			]);

			if (result.affectedRows === 0) {
				throw new NotFoundError('Appointment not found.');
			}
		} catch (error) {
			console.error('Error soft deleting appointment:', error);
			throw new DatabaseError('Failed to soft delete appointment.', error);
		}
	}

	/**
	 * Updates the status of an appointment in the database.
	 * @param {number} appointmentId - The ID of the appointment to be updated.
	 * @param {string} newStatus - The new status to set for the appointment. The value must be one of the valid status options.
	 * @returns {Promise<void>} - A promise that resolves when the status update operation is complete.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	static async updateAppointmentStatus(appointmentId, newStatus) {
		const queryUpdateAppointmentStatus =
			'UPDATE appointment SET appointmentStatus = ? WHERE appointmentId = ?';

		try {
			const [result] = await pool.execute(queryUpdateAppointmentStatus, [
				newStatus,
				appointmentId,
			]);

			if (result.affectedRows === 0) {
				throw new NotFoundError('Appointment not found.');
			}
		} catch (error) {
			console.error('Error updating appointment status:', error);
			throw new DatabaseError('Failed to update appointment status.', error);
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
				throw new NotFoundError("Appointment doesn't exist.");
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
			throw error;
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
		const queryGetAppointments = `SELECT * FROM appointment WHERE doctorId = ? AND DATE(appointmentTime) = DATE(?) AND appointmentStatus NOT IN (?)
			AND deletedAt IS NULL `;

		try {
			const [results] = await pool.execute(queryGetAppointments, [
				doctorId,
				date,
				Status.CANCELED,
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
			AND appointmentStatus NOT IN (?)
			AND deletedAt IS NULL
			FOR UPDATE`;

		try {
			const [results] = await connection.execute(queryCheckOverlap, [
				doctorId,
				date,
				appointmentTimeString,
				Status.CANCELED,
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
			throw error;
		}
	}
};
