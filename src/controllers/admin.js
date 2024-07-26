const { ValidationError, NotFoundError } = require('../utils/customErrors');
const {
	sendSuccessResponse,
	sendErrorResponse,
} = require('../utils/responseHandlers');
const { validateUserRoleUpdate } = require('../utils/validations');

/**
 * Update the role of a specified user
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @param {function} next - The next middleware function
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - If there is an error during the role update process.
 */
exports.updateUserRole = async (req, res, next) => {
	const clientId = parseInt(req.params.clientId);
	const { newRole } = req.body;

	try {
		const client = await validateUserRoleUpdate(clientId, newRole);

		const isUpdatedRole = await client.updateUserRole(newRole);

		if (!isUpdatedRole) {
			throw new Error('User role update failed.');
		}

		sendSuccessResponse(res, 200, 'User role updated successfully.', {
			newRole,
		});
	} catch (error) {
		if (error instanceof ValidationError) {
			sendErrorResponse(res, 400, error.message);
		} else if (error instanceof NotFoundError) {
			sendErrorResponse(res, 404, error.message);
		} else {
			next(error);
		}
	}
};
