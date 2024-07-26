/**
 * Sends a success response.
 * @param {Object} res - The Express response object.
 * @param {number} statusCode - The HTTP status code.
 * @param {string} message - The message to send in the response.
 * @param {Object|null} [data=null] - Optional data to include in the response.
 */
exports.sendSuccessResponse = (res, statusCode, message, data = null) => {
	const response = {
		message: message,
	};
	if (data) {
		response.data = data;
	}
	res.status(statusCode).json(response);
};

/**
 * Sends an error response.
 * @param {Object} res - The Express response object.
 * @param {number} statusCode - The HTTP status code.
 * @param {string} message - The error message to send in the response.
 * @param {Object|null} [errors=null] - Optional errors to include in the response.
 */
exports.sendErrorResponse = (res, statusCode, message, errors = null) => {
	const response = {
		message: message,
	};
	if (errors) {
		response.errors = errors;
	}
	res.status(statusCode).json(response);
};
