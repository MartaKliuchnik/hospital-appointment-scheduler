const { pool } = require('../utils/database');
const {
	DatabaseError,
	NotFoundError,
	ValidationError,
} = require('../utils/customErrors');
const Role = require('../enums/Role');

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
		this.specialization = specialization?.toUpperCase();
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
		} catch {
			// console.error('Error inserting doctor:', error);
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
		const columns = [
			'doctorId',
			'firstName',
			'lastName',
			'specialization',
			...(clientRole === Role.ADMIN ? ['isActive'] : []),
		];
		const querySelectDoctors = `SELECT ${columns.join(', ')} FROM doctor ${
			clientRole === Role.ADMIN ? '' : 'WHERE isActive = 1'
		}`;

		try {
			const [results] = await pool.execute(querySelectDoctors);
			return results.length > 0 ? results : [];
		} catch {
			// console.error('Error retrieving doctors:', error);
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
		const columns = [
			'doctorId',
			'firstName',
			'lastName',
			'specialization',
			...(clientRole === Role.ADMIN ? ['isActive'] : []),
		];
		const querySelectDoctorById = `SELECT ${columns.join(
			', '
		)} FROM doctor WHERE doctorId = ? ${
			clientRole === Role.ADMIN ? '' : 'AND isActive = 1'
		}`;

		try {
			const [results] = await pool.execute(querySelectDoctorById, [doctorId]);
			return results.length > 0 ? results[0] : null;
		} catch {
			// console.error('Error retrieving doctor:', error);
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
			'UPDATE doctor SET isActive = 0 WHERE doctorId = ?';

		try {
			const [result] = await pool.execute(querySoftDeleteDoctor, [doctorId]);

			if (result.affectedRows === 0) {
				throw new NotFoundError('Doctor not found.');
			}
		} catch (error) {
			// console.error('Error deleting doctor:', error);
			if (error.code === 'ER_ROW_IS_REFERENCED_2') {
				throw new ValidationError(
					'This doctor has appointments. Deletion is forbidden.'
				);
			} else if (error instanceof NotFoundError) {
				throw error;
			} else {
				throw new DatabaseError('Failed to delete doctor.');
			}
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
			// console.error('Error updating doctor:', error);
			if (error instanceof ValidationError) {
				throw error;
			} else {
				throw new DatabaseError('Failed to update doctor.');
			}
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
		} catch {
			// console.error('Error checking doctor appointments:', error);
			throw new DatabaseError('Failed to check doctor appointments.');
		}
	}

	/**
	 * Retrieve a doctor by specified name and specialization from the database.
	 * @param {string} firstName - The first name of the doctor to search for.
	 * @param {string} lastName - The last name of the doctor to search for.
	 * @param {string} specialization - The medical specialization of the doctor to search for.
	 * @returns {Promise<Array<Object>|null>} - A promise that resolves to a Doctor object if found, or null if no match is found.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	static async findByNameAndSpecialization(
		firstName,
		lastName,
		specialization
	) {
		const columns = [
			'doctorId',
			'firstName',
			'lastName',
			'specialization',
			'isActive',
		];
		const query = `SELECT ${columns.join(
			', '
		)} FROM doctor WHERE firstName = ? AND lastName = ? AND specialization = ? AND isActive = 1 LIMIT 1`;

		try {
			const [result] = await pool.execute(query, [
				firstName,
				lastName,
				specialization,
			]);
			return result.length > 0 ? new Doctor(result[0]) : null;
		} catch {
			throw new DatabaseError(
				'Failed to retrieve doctor by name and specialization.'
			);
		}
	}
};
