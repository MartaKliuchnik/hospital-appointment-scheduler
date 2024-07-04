const path = require('path');
const rootDir = require('../utils/path');
const { verifyJWT } = require('../utils/jwt');

exports.checkUser = (req, res, next) => {
	if (req.session?.users) next();
	else
		res.status(401).send({
			error:
				'Authentication failed: Ensure that the correct authentication token is provided in the request header.',
		});
};

exports.authenticateJWT = (req, res, next) => {
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

	req.user = decodedPayload;
	next();
};

exports.getAppointments = (req, res) => {
	res.sendFile(path.join(rootDir, 'views', 'schedule-page.html'));
};
