const { verifyJWT } = require('../utils/jwt');

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
