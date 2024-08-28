const Role = require('../enums/Role');
const { comparePassword } = require('../utils/auth');
const { pool } = require('../utils/database');
const { createJWT } = require('../utils/jwt');
const {
	DatabaseError,
	NotFoundError,
	ValidationError,
} = require('../utils/customErrors');

module.exports = class Client {
	/**
	 * @param {string} firstName - The first name of the client.
	 * @param {string} lastName - The last name of the client.
	 * @param {string} phoneNumber - The phone number of the client.
	 * @param {string} email - The email address of the client.
	 * @param {string} hashedPassword - The hashed password of the client.
	 * @param {Role} role - The role of the client (default: Role.PATIENT).
	 * @param {number|null} clientId - The ID of the client (default: null).
	 * @param {Date|null} [deletedAt=null] - The timestamp indicating when the client was deleted, if applicable. Defaults to null for non-deleted clients.
	 */
	constructor(
		firstName,
		lastName,
		phoneNumber,
		email,
		hashedPassword,
		role,
		clientId = null,
		deletedAt = null
	) {
		this.firstName = firstName;
		this.lastName = lastName;
		this.phoneNumber = phoneNumber;
		this.email = email;
		this.password = hashedPassword;
		this.role = role || Role.PATIENT;
		this.clientId = clientId;
		this.deletedAt = deletedAt;
	}

	/**
	 * Validate email address.
	 * @param {string} email - The email address to be validated.
	 * @returns {boolean} - Returns true if the email address is valid, false otherwise.
	 */
	static validateEmail(email) {
		const emailRegex =
			/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return emailRegex.test(email);
	}

	/**
	 * Validate phone number.
	 * @param {string} phoneNumber - The phone number to be validated.
	 * @returns {boolean} - Returns true if the phone number is valid, false otherwise.
	 */
	static validatePhone(phoneNumber) {
		const phoneNumberRegex =
			/^\+?[1-9]\d{1,14}$|^(\+\d{1,2}\s?)?((\(\d{1,4}\))|\d{1,4})?[\s.-]?\d{1,4}[\s.-]?\d{1,4}[\s.-]?\d{1,9}$/;
		return phoneNumberRegex.test(phoneNumber);
	}

	/**
	 * Verify a plain-text password against a hashed password.
	 * @param {string} inputPassword - The plain-text password to verify.
	 * @returns {Promise<boolean>} A promise that resolves to true if the password is valid, false otherwise.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	async verifyPassword(inputPassword) {
		try {
			return await comparePassword(inputPassword, this.password);
		} catch {
			throw new DatabaseError('Error during authentication.');
		}
	}

	/**
	 * Register a new client in the database.
	 * @returns {Promise<number>} A promise that resolves to the ID of the newly created client.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	async register() {
		const queryAddClient =
			'INSERT INTO client (firstName, lastName, phoneNumber, email, password, role, deletedAt) VALUES (?, ?, ?, ?, ?, ?, ?)';

		try {
			const [client] = await pool.execute(queryAddClient, [
				this.firstName,
				this.lastName,
				this.phoneNumber,
				this.email,
				this.password,
				this.role,
				this.deletedAt,
			]);

			this.clientId = client.insertId;
			return this.clientId;
		} catch {
			throw new DatabaseError('Failed to register client.');
		}
	}

	/**
	 * Find a client by their email address.
	 * @param {string} email - The email address of the client to find.
	 * @returns {Promise<Client|null>} - A promise that resolves to a Client instance, or null if not found.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	static async findByEmail(email) {
		const columns = [
			'firstName',
			'lastName',
			'phoneNumber',
			'email',
			'password',
			'role',
			'clientId',
			'deletedAt',
		];
		const query = `SELECT ${columns.join(',')} FROM client WHERE email = ?`;

		try {
			const [rows] = await pool.execute(query, [email]);
			if (rows.length === 0) return null;

			const clientData = rows[0];

			return new Client(
				clientData.firstName,
				clientData.lastName,
				clientData.phoneNumber,
				clientData.email,
				clientData.password,
				clientData.role,
				clientData.clientId,
				clientData.deletedAt
			);
		} catch {
			throw new DatabaseError('Failed to find client by email.');
		}
	}

	/**
	 * Find a client by their ID.
	 * @param {number} clientId - The ID of the client to find.
	 * @returns {Promise<Client|null>} - A promise that resolves to a Client instance, or null if not found.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	static async findById(clientId) {
		const columns = [
			'firstName',
			'lastName',
			'phoneNumber',
			'email',
			'password',
			'role',
			'clientId',
			'deletedAt',
		];
		const query = `SELECT ${columns.join(',')} FROM client WHERE clientId = ?`;

		try {
			const [rows] = await pool.execute(query, [clientId]);
			if (rows.length === 0) return null;

			const clientData = rows[0];

			return new Client(
				clientData.firstName,
				clientData.lastName,
				clientData.phoneNumber,
				clientData.email,
				clientData.password,
				clientData.role,
				clientData.clientId,
				clientData.deletedAt
			);
		} catch {
			throw new DatabaseError('Failed to find client by ID.');
		}
	}

	/**
	 * Retrieve a list of all clients from the database.
	 * @returns {Promise<Array<Object>|null>} - A promise that resolves to the list of clients, or null if none found.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	static async getAll() {
		const columns = [
			'clientId',
			'firstName',
			'lastName',
			'email',
			'password',
			'phoneNumber',
			'registrationDate',
			'role',
			'deletedAt',
		];
		const querySelectClients = `SELECT ${columns.join(',')} FROM client`;

		try {
			const [results] = await pool.execute(querySelectClients);
			return results.length > 0 ? results : [];
		} catch {
			throw new DatabaseError('Failed to retrieve clients.');
		}
	}

	/**
	 * Create an authentication token (JWT) for a given client.
	 * @returns {string} - The created JWT token.
	 * @throws {Error} - Throws an error if token creation fails.
	 */
	createAuthToken() {
		const payload = {
			clientId: this.clientId,
			firstName: this.firstName,
			lastName: this.lastName,
			role: this.role,
			iat: Math.floor(Date.now() / 1000),
		};

		try {
			return createJWT(
				{ alg: 'HS256', typ: 'JWT' },
				payload,
				process.env.JWT_SECRET
			);
		} catch {
			throw new DatabaseError('Error creating authentication token.');
		}
	}

	/**
	 * Remove sensitive information from the client object.
	 * @returns {Object} - An object containing only the safe-to-expose client data.
	 */
	toSafeObject() {
		return {
			clientId: this.clientId,
			firstName: this.firstName,
			lastName: this.lastName,
			phoneNumber: this.phoneNumber,
			email: this.email,
			registrationData: this.registrationData,
			role: this.role,
			deletedAt: this.deletedAt,
		};
	}

	/**
	 * Update the role of the client.
	 * @param {Role} newRole - The new role to assign to the client.
	 * @returns {Promise<boolean>} - A promise that resolves to true if the role was successfully updated, false otherwise.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	async updateUserRole(newRole) {
		// First, check if the new role is different from the current role
		if (this.role === newRole) {
			// console.error('Role is already set to the new value');
			return false;
		}

		const query = 'UPDATE client SET role = ? WHERE clientId = ?';

		try {
			const [result] = await pool.execute(query, [newRole, this.clientId]);

			// Check if the update was successful
			if (result.affectedRows > 0) {
				this.role = newRole;
				return true;
			}

			return false;
		} catch {
			throw new DatabaseError('Failed to update user role.');
		}
	}

	/**
	 * Find a client by their phone number.
	 * @param {string} phoneNumber - The phone number of the client to find.
	 * @returns {Promise<Client|null>} - A promise that resolves to a Client instance, or null if not found.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	static async findByPhoneNumber(phoneNumber) {
		const columns = [
			'firstName',
			'lastName',
			'phoneNumber',
			'email',
			'password',
			'role',
			'clientId',
			'deletedAt',
		];
		const query = `SELECT ${columns.join(
			','
		)} FROM client WHERE phoneNumber = ?`;

		try {
			const [rows] = await pool.execute(query, [phoneNumber]);
			if (rows.length === 0) return null;

			const clientData = rows[0];

			return new Client(
				clientData.firstName,
				clientData.lastName,
				clientData.phoneNumber,
				clientData.email,
				clientData.password,
				clientData.role,
				clientData.clientId,
				clientData.deletedAt
			);
		} catch {
			throw new DatabaseError('Failed to find client by phone number.');
		}
	}

	/**
	 * Soft deletes the specific client from the database.
	 * @param {number} clientId - The ID of the client to be deleted.
	 * @param {object} connection - The database connection object used for executing the query.
	 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	static async softDelete(clientId, connection) {
		const query = 'UPDATE client SET deletedAt = NOW() WHERE clientId = ?';

		try {
			const [result] = await connection.execute(query, [clientId]);

			if (result.affectedRows === 0) {
				throw new NotFoundError('Client not found.');
			}
		} catch (error) {
			// console.error('Error deleting client:', error);

			if (error.code === 'ER_ROW_IS_REFERENCED_2') {
				throw new ValidationError(
					'This client has appointments. Deletion is forbidden.'
				);
			} else if (error instanceof NotFoundError) {
				throw error;
			} else {
				throw new DatabaseError('Failed to delete client.');
			}
		}
	}

	/**
	 * Deletes the specific client from the database permanantly.
	 * @param {number} clientId - The ID of the client to be deleted.
	 * @param {object} connection - The database connection object used for executing the query.
	 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	static async hardDelete(clientId, connection) {
		const query = 'DELETE FROM client WHERE clientId = ?';

		try {
			const [result] = await connection.execute(query, [clientId]);
			if (result.affectedRows === 0) {
				throw new NotFoundError('Client not found.');
			}
		} catch (error) {
			// console.error('Error deleting user:', error);
			if (error instanceof NotFoundError) {
				throw error;
			} else {
				throw new DatabaseError('Failed to delete client.', error);
			}
		}
	}
};
