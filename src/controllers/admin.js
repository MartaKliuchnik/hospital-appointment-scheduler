const Client = require('../models/client');
const {
	ValidationError,
	NotFoundError,
	ConflictError,
	DatabaseError,
} = require('../utils/customErrors');
const { pool } = require('../utils/database');
const {
	sendSuccessResponse,
	sendErrorResponse,
} = require('../utils/responseHandlers');
const {
	validateUserRoleUpdate,
	validateClientId,
	validateClientDeletion,
} = require('../utils/validations');

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

/**
 * Deletes the specified client.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - If there is an error during the role update process.
 */
exports.deleteClient = async (req, res, next) => {
	const clientId = parseInt(req.params.clientId);

	const connection = await pool.getConnection();
	await connection.beginTransaction();

	try {
		await validateClientDeletion(clientId);

		const client = await Client.findById(clientId);
		// Check if the client exists
		if (!client) {
			throw new NotFoundError('Client not found.');
		}

		await Client.delete(clientId, connection);

		await connection.commit();
		sendSuccessResponse(res, 200, 'Client deleted successfully.');
	} catch (error) {
		if (connection) await connection.rollback();

		if (error instanceof ValidationError) {
			sendErrorResponse(res, 400, error.message);
		} else if (error instanceof NotFoundError) {
			sendErrorResponse(res, 404, error.message);
		} else if (error instanceof ConflictError) {
			sendErrorResponse(res, 409, error.message);
		} else {
			next(new DatabaseError('Failed to delete client.', error));
		}
	} finally {
		connection.release();
	}
};
