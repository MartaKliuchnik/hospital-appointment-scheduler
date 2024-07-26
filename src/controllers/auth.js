const path = require('path');
const rootDir = require('../utils/path');
const { hashPassword } = require('../utils/auth');
const Client = require('../models/client');
const {
	validateLoginInput,
	validateRegistrationInput,
} = require('../utils/validations');
const {
	AuthenticationError,
	DatabaseError,
	ValidationError,
	ConflictError,
} = require('../utils/customErrors');
const { sendSuccessResponse } = require('../utils/responseHandlers');
const { log } = require('console');

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
 * @param {function} next - The next middleware function.
 * @returns {Promise<void>} - Sends a JSON response with a token and sanitized client data if successful, or an error message if not.
 * @throws {Error} - If there is an error during the loggin process.
 */
exports.postLogin = async (req, res, next) => {
	const { email, password } = req.body;

	try {
		validateLoginInput(email, password);

		const client = await Client.findByEmail(email);
		if (!client) {
			throw new AuthenticationError('User does not exist.');
		}

		let isPasswordValid = await client.verifyPassword(password);
		if (!isPasswordValid) {
			throw new AuthenticationError('Incorrect email or password.');
		}

		const token = client.createAuthToken();

		sendSuccessResponse(res, 200, 'User logged successfully.', {
			token,
			client: client.toSafeObject(),
		});
	} catch (error) {
		if (
			error instanceof ValidationError ||
			error instanceof AuthenticationError
		) {
			next(error);
		} else {
			next(
				new DatabaseError('An unexpected error occurred during login.', error)
			);
		}
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
 * @param {function} next - The next middleware function.
 * @returns {Promise<void>} - Sends a JSON response with a success message and client ID if successful, or an error message if not.
 * @throws {Error} - If there is an error during the registration process.
 */
exports.postRegister = async (req, res, next) => {
	const { firstName, lastName, phoneNumber, email, password } = req.body;

	try {
		await validateRegistrationInput(
			firstName,
			lastName,
			phoneNumber,
			email,
			password
		);

		const hashedPassword = await hashPassword(password);
		const client = new Client(
			firstName,
			lastName,
			phoneNumber,
			email,
			hashedPassword
		);
		const clientId = await client.register();

		sendSuccessResponse(res, 200, 'User registered successfully', { clientId });
	} catch (error) {
		console.error('Registration error:', error);

		if (error instanceof ConflictError) {
			next(error);
		} else if (error instanceof ValidationError) {
			next(error);
		} else {
			next(
				new DatabaseError(
					'An unexpected error occurred during registration.',
					error
				)
			);
		}
	}
};
