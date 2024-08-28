const {
	ValidationError,
	AuthenticationError,
	DatabaseError,
	ConflictError,
} = require('../utils/customErrors');
const { sendErrorResponse } = require('../utils/responseHandlers');

/**
 * Middleware to handle errors and send appropriate responses.
 * @param {Error} err - The error object.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function.
 * @returns {void}
 */
const errorHandler = (err, req, res) => {
	console.error('Error:', err);

	if (err instanceof ValidationError) {
		return sendErrorResponse(res, 400, err.message);
	}

	if (err instanceof AuthenticationError) {
		return sendErrorResponse(res, 401, err.message);
	}

	if (err instanceof ConflictError) {
		return sendErrorResponse(res, 409, err.message);
	}

	if (err instanceof DatabaseError) {
		console.error('Database Error:', err.originalError);
		return sendErrorResponse(
			res,
			500,
			'A database error occurred. Please try again later.'
		);
	}

	console.error('Unexpected Error:', err);
	return sendErrorResponse(
		res,
		500,
		'An unexpected error occurred. Please try again later.'
	);
};

module.exports = errorHandler;
