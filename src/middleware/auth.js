const Client = require('../models/client');
const { pool } = require('../utils/database');
const { verifyJWT, createJWT } = require('../utils/jwt');

/**
 * Middleware to check the authentication of a request.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function in the stack.
 * @returns {void} - This middleware does not return a value.
 * @throws {Error} - If there is an error during token verification or if the token is missing/invalid.
 */
exports.checkAuth = async (req, res, next) => {
	const token = req.headers.authorization?.split(' ')[1];

	if (!token) {
		req.client = null; // Set req.client to null if no token
		return next();
	}

	try {
		const secret = process.env.JWT_SECRET;
		let decodedPayload = verifyJWT(token, secret);

		if (!decodedPayload) {
			// Access token is invalid or expired, check for session and refresh token
			const session = await findSessionByToken(token);

			if (
				session &&
				new Date() + 'Z' < new Date(session?.refreshTokenExpiresAt)
			) {
				// Refresh token is valid; generate a new access token
				const clientId = session.clientId;
				const client = await Client.findById(clientId);

				const newAccessToken = client.createAuthToken();

				// Update session with new access token
				await updateSessionToken(session.sessionId, newAccessToken);

				// Set new access token in response header
				res.setHeader('Authorization', `Bearer ${newAccessToken}`);
				decodedPayload = verifyJWT(newAccessToken, secret);
			} else {
				// Refresh token is invalid or expired, invalidate session
				// await pool.execute(
				// 	'DELETE FROM session WHERE sessionId = ?',
				// 	session?.sessionId
				// );
				req.client = null;
				return next();
			}
		}

		req.client = {
			clientId: decodedPayload.clientId,
			firstName: decodedPayload.firstName,
			lastName: decodedPayload.lastName,
			role: decodedPayload.role,
		};
		next();
	} catch (error) {
		console.error('Token verification error:', error);
		req.client = null;
		next();
	}
};

/**
 * Find the session by access token.
 * @param {string} token - The access token.
 * @returns {Promise<object|null>} - Returns the session if found, null otherwise.
 */
async function findSessionByToken(token) {
	const columns = [
		'sessionId',
		'clientId',
		'token',
		'tokenExpiresAt',
		'refreshToken',
		'refreshTokenExpiresAt',
	];
	const [session] = await pool.execute(
		`SELECT ${columns.join(', ')} FROM session WHERE token = ?`,
		[token]
	);

	return session[0] || null;
}

/**
 * Update the session with a new access token.
 * @param {number} sessionId - The session ID.
 * @param {string} newToken - The new access token.
 * @returns {Promise<void>}
 */
async function updateSessionToken(sessionId, newToken) {
	const query =
		'UPDATE session SET token = ?, tokenExpiresAt = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE sessionId = ?';
	await pool.execute(query, [newToken, sessionId]);
}
