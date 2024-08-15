const { sendErrorResponse } = require("../utils/responseHandlers");

/**
 * Middleware to ensure a required URL parameter is present.
 * If the parameter is missing, a 400 Bad Request response is sent.
 * 
 * @param {string} param - The name of the required parameter.
 * @param {string} errorMessage - The custom error message to send if the parameter is missing.
 * @returns {function} - Express middleware function.
 */
exports.requireParam = (param, errorMessage) => (req, res, next) => {
	if (!req.params[param]) {
		return sendErrorResponse(res, 400, errorMessage);
	}
	next();
};
