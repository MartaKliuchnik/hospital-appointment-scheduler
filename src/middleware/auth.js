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
	const token = req.headers.authorization?.split(' ')[1];

	if (!token) {
		req.client = null; // Set req.client to null if no token
		return next();
	}

	try {
		const secret = process.env.JWT_SECRET;
		const decodedPayload = verifyJWT(token, secret);

		if (!decodedPayload) {
			req.client = null; // Set req.client to null if invalid token
			return next(); 
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
