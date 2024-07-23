const { pool } = require('../utils/database');

module.exports = class Schedule {
	/**
	 * @param {number} doctorId - The ID of the doctor.
	 * @param {string} scheduleDay - The day of week.
	 * @param {string} startTime - The first available slot for schedule.
	 * @param {string} endTime - The last available slot for schedule.
	 * @param {number|null} scheduleId - The ID of the schedule.
	 */
	constructor(doctorId, scheduleDay, startTime, endTime, scheduleId = null) {
		this.doctorId = doctorId;
		this.scheduleDay = scheduleDay;
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
			throw new Error('Failed to insert schedule.');
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
			throw new Error('Failed to retrieve schedule.');
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
			console.error('Error retrieving schedule:', error);
			throw new Error('Failed to retrieve schedule.');
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
};
