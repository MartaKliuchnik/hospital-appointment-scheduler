const path = require('path');
const rootDir = require('../utils/path');

exports.getAppointments = (req, res) => {
	res.sendFile(path.join(rootDir, '../views', 'schedule-page.html'));
};
