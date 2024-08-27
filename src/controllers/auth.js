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
const { pool } = require('../utils/database');

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

		await checkExistingSession(client.clientId);
		const token = await createAndStoreSession(client);

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
 * Check if an existing session already exists for the client.
 * @param {*} clientId - The ID of the client to check for an existing session.
 * @returns {Promise<void>} - Resolves if no existing session is found; otherwise, throws an AuthenticationError.
 */
async function checkExistingSession(clientId) {
	const queryGetExistedClient =
		'SELECT sessionId FROM session WHERE clientId = ?';

	const existingSession = await pool.execute(queryGetExistedClient, [clientId]);
	if (existingSession[0].length > 0) {
		throw new AuthenticationError('You are already logged in.');
	}
}

/**
 * Create and store a new session for the client.
 * @param {object} client - The client object containing the client's details.
 * @returns {Promise<string>} - The authentication token created and stored in the session.
 */
async function createAndStoreSession(client) {
	const token = client.createAuthToken();

	const query = `INSERT INTO session (clientId, token, expiresAt) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))`;
	// Store the token in the session table
	await pool.execute(query, [client.clientId, token]);

	return token;
}

/**
 * Handle user logout requests.
 * @param {*} req - The request object, containing the authorization token in the headers.
 * @param {*} res - The response object.
 * @param {*} next - The next middleware function.
 * @returns {Promise<void>} - Sends a JSON response with a success message if the logout is successful, or an error message if not.
 */
exports.logout = async (req, res, next) => {
	const token = req.headers.authorization?.split(' ')[1];

	if (!token) {
		return next(new AuthenticationError('No token provided.'));
	}

	console.log(token);
	try {
		await pool.execute('DELETE FROM session WHERE token = ?', [token]);
		sendSuccessResponse(res, 200, 'User logged out successfully.');
	} catch (error) {
		next(
			new DatabaseError('An unexpected error occurred during logout.', error)
		);
	}
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
	const { firstName, lastName, phoneNumber, email, password, role } = req.body;

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
			hashedPassword,
			role
		);
		const clientId = await client.register();

		sendSuccessResponse(res, 200, 'User registered successfully', { clientId });
	} catch (error) {
		// console.error('Registration error:', error);

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
