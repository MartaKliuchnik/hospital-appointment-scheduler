const path = require('path');
const rootDir = require('../utils/path');
const { hashPassword, comparePassword } = require('../utils/auth');
const { createJWT } = require('../utils/jwt');
const { pool } = require('../utils/database');

/**
 * Serve the login page.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {undefined} - This function does not return a value.
 */
exports.getLogin = (req, res) => {
	res.sendFile(path.join(rootDir, '../views', 'login-page.html'));
};

/**
 * Handle login requests.
 * @param {object} req - The request object, containing the email and password in the body.
 * @param {object} res - The response object.
 * @returns {Promise<void>} - Sends a JSON response with a token and sanitized client data if successful, or an error message if not.
 */
exports.postLogin = async (req, res) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).json({
			error: 'Email and password are required',
		});
	}

	try {
		const client = await getUserByEmail(email);

		if (!client) {
			return res.status(401).json({
				error: 'User does not exist',
			});
		}

		let isPasswordValid = await verifyPassword(password, client.password);
		if (!isPasswordValid) {
			return res.status(400).json({ error: 'Incorrect email or password' });
		}

		const token = createAuthToken(client);

		res.status(200).json({
			token,
			client: sanitizeUserData(client),
		});
	} catch (error) {
		console.error('Login error:', error);
		res.status(500).json({ error: 'An error occurred during login' });
	}
};

/**
 * Retrieve a user from the database by their email address.
 * @param {string} email - The email address of the user to retrieve.
 * @returns {Promise<Object|null>} - A promise that resolves to the user object if found, or null if not found.
 */
async function getUserByEmail(email) {
	const query = 'SELECT * FROM clients WHERE email = ?';
	const [rows] = await pool.execute(query, [email]);
	return rows[0] || null;
}

/**
 * Verify a plain-text password against a hashed password.
 * @param {string} inputPassword - The plain-text password to verify.
 * @param {string} hashedPassword - The hashed password to compare against.
 * @returns {Promise<boolean>} A promise that resolves to true if the password is valid, false otherwise.
 * @throws {Error} Throws an error if the password comparison fails.
 */
async function verifyPassword(inputPassword, hashedPassword) {
	try {
		return await comparePassword(inputPassword, hashedPassword);
	} catch (error) {
		console.error('Password comparison error:', error);
		throw new Error('Error during authentication');
	}
}

/**
 * Create an authentication token (JWT) for a given client.
 * @param {Object} client - The client object for which to create the token.
 * @returns {string} - The created JWT token.
 * @throws {Error} - Throws an error if token creation fails.
 */
function createAuthToken(client) {
	const payload = {
		sub: client.client_id,
		first_name: client.first_name,
		last_name: client.last_name,
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
 * @param {Object} user - The user object to sanitize.
 * @returns {Object} A new object with all properties of the user except 'password'.
 */
function sanitizeUserData(user) {
	const { password, ...safeUserData } = user;
	return safeUserData;
}

/**
 * Serve the register page.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {undefined} - This function does not return a value.
 */
exports.getRegister = (req, res) => {
	res.sendFile(path.join(rootDir, '../views', 'register-page.html'));
};

/**
 * Handle client registration requests.
 * @param {object} req - The request object, containing the client's details in the body.
 * @param {object} res - The response object.
 * @returns {Promise<void>} - Sends a JSON response with a success message and client ID if successful, or an error message if not.
 */
exports.postRegister = async (req, res) => {
	const { first_name, last_name, phone_number, email, password } = req.body;

	if (!first_name || !last_name || !phone_number || !email || !password) {
		res.status(400).json({
			error:
				'Invalid input: all fields are required and must be in a valid format.',
		});
	}

	try {
		const hashedPassword = await hashPassword(password);

		const clientId = await registerClient(
			first_name,
			last_name,
			phone_number,
			email,
			hashedPassword
		);

		res.status(201).json({
			message: 'User registered successfully',
			client_id: clientId,
		});
	} catch (error) {
		console.error('Error registering user:', error);
		if (error.code === 'ER_DUP_ENTRY') {
			return res.status(409).json({
				error: 'Email or phone number already in use',
			});
		}

		res
			.status(500)
			.json({ error: 'An unexpected error occurred during registration' });
	}
};

/**
 * Register a new client in the database.
 * @param {string} first_name - The first name of the client.
 * @param {string} last_name - The last name of the client.
 * @param {string} phone_number - The phone number of the client.
 * @param {string} email - The email address of the client.
 * @param {string} hashedPassword - The hashed password of the client.
 * @returns {Promise<number>} A promise that resolves to the ID of the newly created client.
 */
async function registerClient(
	first_name,
	last_name,
	phone_number,
	email,
	hashedPassword
) {
	const queryAddClient =
		'INSERT INTO clients (first_name, last_name, phone_number, email, password) VALUES (?, ?, ?, ?, ?)';

	const [client] = await pool.execute(queryAddClient, [
		first_name,
		last_name,
		phone_number,
		email,
		hashedPassword,
	]);

	return client.client_id;
}
