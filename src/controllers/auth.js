const path = require('path');
const rootDir = require('../utils/path');
const { hashPassword } = require('../utils/auth');
const Client = require('../models/client');

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
		const client = await Client.findByEmail(email);

		if (!client) {
			return res.status(401).json({
				error: 'User does not exist',
			});
		}

		let isPasswordValid = await client.verifyPassword(password);
		if (!isPasswordValid) {
			return res.status(400).json({ error: 'Incorrect email or password' });
		}

		const token = client.createAuthToken();

		res.status(200).json({
			token,
			client: client.toSafeObject(),
		});
	} catch (error) {
		console.error('Login error:', error);
		res.status(500).json({ error: 'An error occurred during login' });
	}
};

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
	const { firstName, lastName, phoneNumber, email, password } = req.body;

	if (!firstName || !lastName || !phoneNumber || !email || !password) {
		res.status(400).json({
			error:
				'Invalid input: all fields are required and must be in a valid format.',
		});
	}

	if (!Client.validateEmail(email)) {
		return res.status(400).json({
			error: 'Invalid email address',
		});
	}

	try {
		const hashedPassword = await hashPassword(password);
		const client = new Client(
			firstName,
			lastName,
			phoneNumber,
			email,
			hashedPassword
		);
		const clientId = await client.register();

		res.status(201).json({
			message: 'User registered successfully',
			clientId,
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
