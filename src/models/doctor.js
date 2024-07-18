const { pool } = require('../utils/database');

module.exports = class Doctor {
	/**
	 * @param {string} firstName - The first name of the doctor.
	 * @param {string} lastName - The last name of the doctor.
	 * @param {string} specialization - The specialization of the doctor.
	 * @param {number|null} doctorId - The ID of the doctor.
	 */
	constructor(firstName, lastName, specialization, doctorId = null) {
		this.firstName = firstName;
		this.lastName = lastName;
		this.specialization = specialization;
		this.doctorId = doctorId;
	}

	/**
	 * Insert a new doctor into the database.
	 * @returns {Promise<number>} - A promise that resolves to the ID of the newly created doctor.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	async insert() {
		const queryCreateDoctor =
			'INSERT INTO doctor (firstName, lastName, specialization) VALUES (?, ?, ?)';

		try {
			const [result] = await pool.execute(queryCreateDoctor, [
				this.firstName,
				this.lastName,
				this.specialization,
			]);

			return result.insertId;
		} catch (error) {
			console.error('Error inserting doctor:', error);
			throw new Error('Failed to insert doctor.');
		}
	}

	/**
	 * Retrieve list with all doctor from the database.
	 * @returns {Promise<Object|null>} - A promise that resolves to the list doctor, or null if database empty.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	static async getAll() {
		const querySelectDoctors = 'SELECT * FROM doctor';

		try {
			const [results] = await pool.execute(querySelectDoctors);

			return results.length > 0 ? results : null;
		} catch (error) {
			console.error('Error retrieving doctors:', error);
			throw new Error('Failed to retrieve doctors.');
		}
	}

	/**
	 * Retrieve a doctor from the database by ID.
	 * @param {number} doctorId - The ID of the doctor to retrieve.
	 * @returns {Promise<Object|null>} - A promise that resolves to the retrieved doctor, or null if not found.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	static async getById(doctorId) {
		const querySelectDoctorById = 'SELECT * FROM doctor WHERE doctorId = ?';

		try {
			const [results] = await pool.execute(querySelectDoctorById, [doctorId]);

			return results.length > 0 ? results : null;
		} catch (error) {
			console.error('Error retrieving doctor:', error);
			throw new Error('Failed to retrieve doctor.');
		}
	}

	/**
	 * Delete a doctor from the database by ID.
	 * @param {number} doctorId - The ID of the doctor.
	 * @returns {Promise<undefined>}
	 * @throws {Error} - If there's an error during the database operation.
	 */
	static async deleteById(doctorId) {
		const queryDeleteDoctor = 'DELETE FROM doctor WHERE doctorId = ?';

		try {
			const [result] = await pool.execute(queryDeleteDoctor, [doctorId]);

			if ((result.affectedRows = 0)) {
				throw new Eror('Doctor not found.');
			}
		} catch (error) {
			console.error('Error deleting doctor:', error);

			if (error.code === 'ER_ROW_IS_REFERENCED_2') {
				throw new Error('This doctor has appointments. Deletion is forbidden.');
			}

			throw new Error('Failed to delete doctor.');
		}
	}
};
