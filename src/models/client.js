const { comparePassword } = require('../utils/auth');
const { pool } = require('../utils/database');
const { createJWT } = require('../utils/jwt');

module.exports = class Client {
	/**
	 * @param {string} firstName - The first name of the client.
	 * @param {string} lastName - The last name of the client.
	 * @param {string} phoneNumber - The phone number of the client.
	 * @param {string} email - The email address of the client.
	 * @param {string} hashedPassword - The hashed password of the client.
	 * @param {string} lastName - The last name of the client.
	 * @param {clientId|null} clientId - The ID of the client.
	 */
	constructor(
		firstName,
		lastName,
		phoneNumber,
		email,
		hashedPassword,
		role = 'patient',
		clientId = null
	) {
		this.firstName = firstName;
		this.lastName = lastName;
		this.phoneNumber = phoneNumber;
		this.email = email;
		this.password = hashedPassword;
		this.role = role;
		this.clientId = clientId;
	}

	/**
	 * Validate email address.
	 * @param {string} email - The email address ti be validated.
	 * @returns {boolean} - Returns true if the email address is valid, false otherwise.
	 */
	static validateEmail(email) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	/**
	 * Verify a plain-text password against a hashed password.
	 * @param {string} inputPassword - The plain-text password to verify.
	 * @returns {Promise<boolean>} A promise that resolves to true if the password is valid, false otherwise.
	 * @throws {Error} Throws an error if the password comparison fails.
	 */
	async verifyPassword(inputPassword) {
		try {
			return await comparePassword(inputPassword, this.password);
		} catch (error) {
			console.error('Password comparison error:', error);
			throw new Error('Error during authentication');
		}
	}

	/**
	 * Register a new client in the database.
	 * @returns {Promise<number>} A promise that resolves to the ID of the newly created client.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	async register() {
		const queryAddClient =
			'INSERT INTO client (firstName, lastName, phoneNumber, email, password, role) VALUES (?, ?, ?, ?, ?, ?)';

		try {
			const [client] = await pool.execute(queryAddClient, [
				this.firstName,
				this.lastName,
				this.phoneNumber,
				this.email,
				this.password,
				this.role,
			]);

			this.clientId = result.insertId;
			return this.clientId;
		} catch (error) {
			console.error('Error registering client:', error);
			throw new Error('Failed to register client');
		}
	}

	/**
	 * Find a client from the database by their email address.
	 * @param {string} email - The email of the client to find.
	 * @returns {Promise<Client|null>} - A promise that resolves to a Client instance, or null if not found.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	static async findByEmail(email) {
		const query = 'SELECT * FROM client WHERE email = ?';

		try {
			const [rows] = await pool.execute(query, [email]);
			if (rows.length === 0) return null;

			const clientData = rows[0];
			console.log(clientData);

			return new Client(
				clientData.firstName,
				clientData.lastName,
				clientData.phoneNumber,
				clientData.email,
				clientData.password,
				clientData.role,
				clientData.clientId
			);
		} catch (error) {
			console.error('Error finding client by email:', error);
			throw new Error('Failed to find client');
		}
	}

	/**
	 * Find a client from the database by their clientId.
	 * @param {string} clientId - The clientId of the client to find.
	 * @returns {Promise<Client|null>} - A promise that resolves to a Client instance, or null if not found.
	 * @throws {Error} - If there's an error during the database operation.
	 */
	static async findById(clientId) {
		const query = 'SELECT * FROM client WHERE clientId = ?';

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
				clientData.clientId
			);
		} catch (error) {
			console.error('Error finding client by id:', error);
			throw new Error('Failed to find client');
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
		} catch (error) {
			console.error('JWT creation error:', error);
			throw new Error('Error creating authentication token');
		}
	}

	/**
	 * Remove sensitive information from a user object.
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
		};
	}
};
