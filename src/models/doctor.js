const { pool } = require('../utils/database');
const {
	DatabaseError,
	NotFoundError,
	ValidationError,
} = require('../utils/customErrors');

module.exports = class Doctor {
	/**
	 * @param {string} firstName - The first name of the doctor.
	 * @param {string} lastName - The last name of the doctor.
	 * @param {string} specialization - The specialization of the doctor.
	 * @param {number|null} doctorId - The ID of the doctor (default: null).
	 * @param {boolean} [isActive=true] - The active status of the doctor (default: true).
	 */
	constructor(
		firstName,
		lastName,
		specialization,
		doctorId = null,
		isActive = true
	) {
		this.firstName = firstName;
		this.lastName = lastName;
		this.specialization = specialization.toUpperCase();
		this.doctorId = doctorId;
		this.isActive = isActive;
	}

	/**
	 * Insert a new doctor into the database.
	 * @returns {Promise<number>} - A promise that resolves to the ID of the newly created doctor.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	async insert() {
		const queryCreateDoctor =
			'INSERT INTO doctor (firstName, lastName, specialization, isActive) VALUES (?, ?, ?, ?)';

		try {
			const [result] = await pool.execute(queryCreateDoctor, [
				this.firstName,
				this.lastName,
				this.specialization,
				this.isActive,
			]);

			this.doctorId = result.insertId;
			return this.doctorId;
		} catch (error) {
			console.error('Error inserting doctor:', error);
			throw new DatabaseError('Failed to insert doctor.');
		}
	}

	/**
	 * Retrieve a list of all doctors from the database.
	 * @param {string} clientRole - The role of the client making the request.
	 * @returns {Promise<Array<Object>|null>} - A promise that resolves to the list of doctors, or null if none found.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	static async getAll(clientRole) {
		const querySelectActiveDoctors = 'SELECT * FROM doctor WHERE isActive = 1';
		const querySelectDoctors = 'SELECT * FROM doctor';


		console.log(`clientRole =`, clientRole);
		let results;
		try {
			if (clientRole === 'ADMIN') {
				[results] = await pool.execute(querySelectDoctors);
			} else {
				[results] = await pool.execute(querySelectActiveDoctors);
			}

			return results.length > 0 ? results : null;
		} catch (error) {
			console.error('Error retrieving doctors:', error);
			throw new DatabaseError('Failed to retrieve doctors.');
		}
	}

	/**
	 * Retrieve a doctor from the database by ID.
	 * @param {string} clientRole - The role of the client making the request.
	 * @param {number} doctorId - The ID of the doctor to retrieve.
	 * @returns {Promise<Object|null>} - A promise that resolves to the retrieved doctor, or null if not found.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	static async getById(doctorId, clientRole) {
		const querySelectActiveDoctorById =
			'SELECT * FROM doctor WHERE doctorId = ? AND isActive = 1';
		const querySelectDoctorById = 'SELECT * FROM doctor WHERE doctorId = ?';

		let results;
		try {
			if (clientRole === 'ADMIN') {
				[results] = await pool.execute(querySelectDoctorById, [doctorId]);
			} else {
				[results] = await pool.execute(querySelectActiveDoctorById, [doctorId]);
			}

			return results.length > 0 ? results[0] : null;
		} catch (error) {
			console.error('Error retrieving doctor:', error);
			throw new DatabaseError('Failed to retrieve doctor.');
		}
	}

	/**
	 * Soft deletes a doctor from the database by ID.
	 * @param {number} doctorId - The ID of the doctor.
	 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	static async deleteById(doctorId) {
		const querySoftDeleteDoctor =
			'UPDATE doctor SET isActive = false WHERE doctorId = ?';

		try {
			const [result] = await pool.execute(querySoftDeleteDoctor, [doctorId]);

			if ((result.affectedRows = 0)) {
				throw new NotFoundError('Doctor not found.');
			}
		} catch (error) {
			console.error('Error deleting doctor:', error);

			if (error.code === 'ER_ROW_IS_REFERENCED_2') {
				throw new ValidationError(
					'This doctor has appointments. Deletion is forbidden.'
				);
			}
			throw new DatabaseError('Failed to delete doctor.');
		}
	}

	/**
	 * Update a doctor's information in the database.
	 * @param {number} doctorId - The ID of the doctor to update.
	 * @param {Object} updateData - An object containing the fields to update.
	 * @returns {Promise<Object>} - A promise that resolves to the updated doctor object.
	 * @throws {Error} - If there's an error during the database operation or if no valid fields are provided.
	 */
	static async updateById(doctorId, updateData) {
		const allowedFields = ['firstName', 'lastName', 'specialization'];
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

		const queryUpdateDoctor = `UPDATE doctor SET ${updates.join(
			', '
		)} WHERE doctorId = ?`;
		values.push(doctorId);

		try {
			const [result] = await pool.execute(queryUpdateDoctor, values);

			if (result.changedRows === 0) {
				throw new ValidationError('Doctor not found.');
			}

			return this.getById(doctorId);
		} catch (error) {
			console.error('Error updating doctor:', error);
			throw new DatabaseError('Failed to update doctor.');
		}
	}

	/**
	 * Check if a doctor has any appointments.
	 * @param {number} doctorId - The ID of the doctor to update.
	 * @returns {Promise<Object>} - A promise that resolves to the check appointments for specific doctor.
	 * @throws {Error} - If there's an error during the database operation or if no valid fields are provided.
	 */
	static async hasAppointments(doctorId) {
		const query =
			'SELECT COUNT(*) as count FROM appointment WHERE doctorId = ?';
		try {
			const [results] = await pool.execute(query, [doctorId]);
			return results[0].count > 0 ? results[0] : null;
		} catch (error) {
			console.error('Error checking doctor appointments:', error);
			throw new DatabaseError('Failed to check doctor appointments.');
		}
	}
};
