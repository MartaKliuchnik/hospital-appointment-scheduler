const path = require('path');
const rootDir = require('../utils/path');

exports.checkUser = (req, res, next) => {
	if (req.session?.users) next();
	else
		res.status(401).send({
			error:
				'Authentication failed: Ensure that the correct authentication token is provided in the request header.',
		});
};

exports.getAppointments = (req, res) => {
	res.sendFile(path.join(rootDir, 'views', 'schedule-page.html'));
};
