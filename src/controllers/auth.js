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

		const { token, refreshToken } = await handleSession(client);

		sendSuccessResponse(res, 200, 'User logged successfully.', {
			token,
			refreshToken,
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
 * Handle the session management for a client, either refreshing an existing session or creating a new one.
 * @param {object} client - The client object containing the client's details.
 * @returns {Promise<string>} - Returns the refreshed or newly created session token.
 */
async function handleSession(client) {
	const existingSession = await getExistingSession(client.clientId);

	if (existingSession) {
		return refreshSession(existingSession.sessionId, client);
	} else {
		return createNewSession(client);
	}
}

/**
 * Check if an existing session already exists for the client.
 * @param {number} clientId - The ID of the client to check for an existing session.
 * @returns {Promise<object|null>} - Returns the existing session object if found; otherwise, returns null.
 */
async function getExistingSession(clientId) {
	const columns = [
		'sessionId',
		'clientId',
		'token',
		'tokenExpiresAt',
		'refreshToken',
		'refreshTokenExpiresAt',
	];
	const queryGetExistingSession = `SELECT ${columns.join(
		', '
	)} FROM session WHERE clientId = ? AND tokenExpiresAt > NOW()`;

	try {
		const [sessions] = await pool.execute(queryGetExistingSession, [clientId]);
		return sessions[0] || null;
	} catch (error) {
		console.error('Error retrieving existing session:', error);
		throw new DatabaseError('Failed to retrieve session.');
	}
}

/**
 * Create and store a new session for the client.
 * @param {object} client - The client object containing the client's details.
 * @returns {Promise<string>} - The authentication token created and stored in the session.
 */
async function createNewSession(client) {
	const token = client.createAuthToken();
	const refreshToken = client.createRefreshToken();

	try {
		const query = `INSERT INTO session (clientId, token, refreshToken, tokenExpiresAt, refreshTokenExpiresAt) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR), DATE_ADD(NOW(), INTERVAL 7 DAY))`;
		await pool.execute(query, [client.clientId, token, refreshToken]);

		return { token, refreshToken };
	} catch (error) {
		console.error('Error creating and storing a new session:', error);
		throw new DatabaseError('Failed to create and store a new session.');
	}
}

/**
 * Refresh the session by updating the access token and refresh token.
 * @param {number} sessionId - The session ID.
 * @param {object} client - The client object containing the client's details.
 * @returns {Promise<object>} - The new tokens generated.
 */
async function refreshSession(sessionId, client) {
	const newToken = client.createAuthToken();
	const newRefreshToken = client.createRefreshToken();

	try {
		const query = `UPDATE session SET token = ?, refreshToken = ?, tokenExpiresAt = DATE_ADD(NOW(), INTERVAL 1 HOUR), refreshTokenExpiresAt = DATE_ADD(NOW(), INTERVAL 7 DAY) WHERE sessionId = ?`;
		await pool.execute(query, [newToken, newRefreshToken, sessionId]);

		return { token: newToken, refreshToken: newRefreshToken };
	} catch (error) {
		console.error(
			'Error updating existing access token and refresh token:',
			error
		);
		throw new DatabaseError('Failed to update access token and refresh token.');
	}
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
