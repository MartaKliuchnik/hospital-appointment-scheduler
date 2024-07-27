const { pool } = require('../utils/database');
const {
	DatabaseError,
	NotFoundError,
	ValidationError,
} = require('../utils/customErrors');

module.exports = class Schedule {
	/**
	 * @param {number} doctorId - The ID of the doctor.
	 * @param {string} scheduleDay - The day of the week for the schedule.
	 * @param {string} startTime - The start time of the doctor's availability.
	 * @param {string} endTime - The end time of the doctor's availability.
	 * @param {number|null} scheduleId - The ID of the schedule (default: null).
	 */
	constructor(doctorId, scheduleDay, startTime, endTime, scheduleId = null) {
		this.doctorId = doctorId;
		this.scheduleDay = scheduleDay.toUpperCase();
		this.startTime = startTime;
		this.endTime = endTime;
		this.scheduleId = scheduleId;
	}

	/**
	 * Insert a new doctor's schedule into the database.
	 * @returns {Promise<number>} - A promise that resolves to the ID of the newly created appointment.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	async insert() {
		const queryCreateSchedule =
			'INSERT INTO schedule (doctorId, scheduleDay, startTime, endTime) VALUES (?, ?, ?, ?)';
		const params = [
			this.doctorId,
			this.scheduleDay,
			this.startTime,
			this.endTime,
		];

		try {
			const [result] = await pool.execute(queryCreateSchedule, params);

			this.scheduleId = result.insertId;
			return this.scheduleId;
		} catch (error) {
			console.error('Error inserting schedule:', error);
			throw new DatabaseError('Failed to create schedule.', error);
		}
	}

	/**
	 * Retrieve a schedule from the database by ID.
	 * @param {number} scheduleId - The ID of the schedule to retrieve.
	 * @returns {Promise<Schedule|null>} - A promise that resolves to the retrieved schedule, or null if not found.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	static async getById(scheduleId) {
		const querySelectSchedule = 'SELECT * FROM schedule WHERE scheduleId = ?';

		try {
			const [results] = await pool.execute(querySelectSchedule, [scheduleId]);

			if (results.length === 0) return null;
			const row = results[0];
			return new Schedule(
				row.doctorId,
				row.scheduleDay,
				row.startTime,
				row.endTime,
				row.scheduleId
			);
		} catch (error) {
			console.error('Error retrieving schedule:', error);
			throw new DatabaseError('Failed to retrieve schedule.', error);
		}
	}

	/**
	 * Retrieve schedules from the database by doctor ID.
	 * @param {number} doctorId - The ID of the specified doctor to retrieve schedules for.
	 * @returns {Promise<Schedule[]>} - A promise that resolves to an array of retrieved schedules.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	static async getByDoctorId(doctorId) {
		const querySelectSchedule = 'SELECT * FROM schedule WHERE doctorId = ?';

		try {
			const [schedules] = await pool.execute(querySelectSchedule, [doctorId]);

			if (schedules.length === 0) return null;
			return schedules.map(Schedule.fromDatabaseResult);
		} catch (error) {
			console.error('Error retrieving schedules by doctor ID:', error);
			throw new DatabaseError('Failed to retrieve schedule.', error);
		}
	}

	/**
	 * Create a Schedule instance from a database result.
	 * @param {Object} row - The database row.
	 * @returns {Schedule} - A new Schedule instance.
	 */
	static fromDatabaseResult(row) {
		return new Schedule(
			row.doctorId,
			row.scheduleDay,
			row.startTime,
			row.endTime,
			row.scheduleId
		);
	}

	/**
	 * Delete a schedule from the database by ID.
	 * @param {number} scheduleId - The ID of the schedule.
	 * @returns {Promise<void>}
	 * @throws {Error} - If there's an error during the database operation.
	 */
	static async deleteById(scheduleId) {
		const queryDeleteSchedule = 'DELETE FROM schedule WHERE scheduleId = ?';

		try {
			const [result] = await pool.execute(queryDeleteSchedule, [scheduleId]);
			if ((result.affectedRows = 0)) {
				throw new NotFoundError('Schedule not found.');
			}
		} catch (error) {
			console.error('Error deleting schedule:', error);
			if (error instanceof NotFoundError) {
				throw error;
			}
			throw new DatabaseError('Failed to delete schedule.', error);
		}
	}

	/**
	 * Update a schedule in the database.
	 * @param {number} scheduleId - The ID of the schedule to update.
	 * @param {Object} updateData - An object containing the fields to update.
	 * @returns {Promise<Object>} - A promise that resolves to the updated schedule object.
	 * @throws {Error} - If there's an error during the database operation or if no valid fields are provided.
	 */
	static async updateById(scheduleId, updateData) {
		const allowedFields = ['scheduleDay', 'startTime', 'endTime'];
		const updates = [];
		const values = [];

		for (const [key, value] of Object.entries(updateData)) {
			if (allowedFields.includes(key)) {
				updates.push(`${key} = ?`);
				values.push(value);
			}
		}

		// Check if the updated data exists
		if (updates.length === 0) {
			throw new ValidationError('No valid fields to update.');
		}

		const queryUpdateSchedule = `UPDATE schedule SET ${updates.join(
			', '
		)} WHERE scheduleId = ?`;
		values.push(scheduleId);

		try {
			const [result] = await pool.execute(queryUpdateSchedule, values);

			if (result.changedRows === 0) {
				throw new NotFoundError('No changes applied to the schedule.');
			}

			return this.getById(scheduleId);
		} catch (error) {
			console.error('Error updating schedule:', error);
			if (error instanceof NotFoundError) {
				throw error;
			}
			throw new DatabaseError('Failed to update schedule.', error);
		}
	}

	/**
	 * Get available time slots for a specific doctor's schedule in the database.
	 * @param {number} doctorId - The ID of the doctor.
	 * @param {string} date - The date to get available slots for, formatted as 'YYYY-MM-DD'.
	 * @param {Function} getAppointmentsByDoctorAndDate - Function to fetch existing appointments.
	 * @returns {Promise<Date[]>} - A promise that resolves to an array of available time slots.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	static async getAvailableTimeSlots(
		doctorId,
		date,
		getAppointmentsByDoctorAndDate
	) {
		const dayOfWeek = new Date(date)
			.toLocaleString('en-us', {
				weekday: 'long',
			})
			.toUpperCase();

		const schedule = await this.getByDoctorId(doctorId);
		if (!schedule) {
			throw new NotFoundError('No schedule found for this doctor.');
		}

		const doctorSchedule = schedule.find(
			(s) => s.scheduleDay.toLowerCase() === dayOfWeek.toLowerCase()
		);
		if (!doctorSchedule) {
			throw new NotFoundError('Doctor is not available on this day.');
		}

		const startTime = new Date(`${date}T${doctorSchedule.startTime}Z`);
		const endTime = new Date(`${date}T${doctorSchedule.endTime}Z`);

		const timeSlots = [];
		let currentSlot = new Date(startTime);

		while (currentSlot < endTime) {
			timeSlots.push(new Date(currentSlot));
			currentSlot.setUTCMinutes(currentSlot.getUTCMinutes() + 20);
		}

		// Get existing appointments for this doctor on this day
		const existingAppointments = await getAppointmentsByDoctorAndDate(
			doctorId,
			date
		);

		// Filter out time slots that are already booked
		const availableSlots = timeSlots.filter((slot) => {
			return !existingAppointments.some((app) => {
				const appTime = new Date(app.appointmentTime);
				return Math.abs(appTime.getTime() - slot.getTime()) < 20 * 60 * 1000; // Less than 20 minutes difference
			});
		});

		return availableSlots;
	}
};
