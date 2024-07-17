const { verifyJWT } = require('../utils/jwt');

/**
 * Middleware to check the authentication of a request.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function in the stack.
 * @returns {void} - This middleware does not return a value.
 * @throws {Error} - If there is an error during token verification or if the token is missing/invalid.
 */
exports.checkAuth = (req, res, next) => {
	try {
		const token = req.headers.authorization?.split(' ')[1];

		if (!token) {
			return res.status(401).send({
				error: 'Authentication failed: Token not provided.',
			});
		}

		const secret = process.env.JWT_SECRET;
		const decodedPayload = verifyJWT(token, secret);

		if (!decodedPayload) {
			return res.status(401).send({
				error: 'Authentication failed: Invalid token.',
			});
		}

		req.client = {
			clientId: decodedPayload.clientId,
			firstName: decodedPayload.firstName,
			lastName: decodedPayload.lastName,
		};
		next();
	} catch (error) {
		console.error('Token verification error:', error);
		return res
			.status(401)
			.json({ error: 'Authentication failed: Invalid token.' });
	}
};
