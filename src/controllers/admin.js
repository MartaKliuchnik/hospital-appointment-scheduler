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
	validateClientDeletion,
	validateClientId,
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
	const hardDelete = req.query.hardDelete === 'true';

	const connection = await pool.getConnection();
	await connection.beginTransaction();

	try {
		await validateClientDeletion(clientId);

		const client = await Client.findById(clientId);
		// Check if the client exists
		if (!client) {
			throw new NotFoundError('Client not found.');
		}

		if (hardDelete) {
			await Client.hardDelete(clientId, connection);
		} else {
			await Client.softDelete(clientId, connection);
		}

		await connection.commit();
		sendSuccessResponse(
			res,
			200,
			hardDelete
				? 'Client hard deleted successfully.'
				: 'Client soft deleted successfully.'
		);
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

/**
 * Retrieve list of clients from the database.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - If there is an error during the client retrieval process.
 */
exports.listClients = async (req, res, next) => {
	try {
		const clients = await Client.getAll();

		// Check if the clients exist in the database
		if (!clients || clients.length === 0) {
			throw new NotFoundError('No clients found in the database.');
		}

		sendSuccessResponse(res, 200, 'Clients retrieved successfully.', clients);
	} catch (error) {
		if (error instanceof NotFoundError) {
			sendErrorResponse(res, 404, error.message);
		} else {
			next(new DatabaseError('Failed to retrieve clients.', error));
		}
	}
};

/**
 * Retrieve client by their ID.
 * @param {object} req - The request object containing the client ID in params.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - If there is an error during the appointment retrieval process.
 */
exports.getClientById = async (req, res, next) => {
	const clientId = parseInt(req.params.clientId);
	try {
		validateClientId(clientId);

		const client = await Client.findById(clientId);
		// Check if the client exists
		if (!client) {
			throw new NotFoundError('Client not found.');
		}

		sendSuccessResponse(res, 200, 'Client retrieved successfully.', client);
	} catch (error) {
		if (error instanceof ValidationError) {
			sendErrorResponse(res, 400, error.message);
		} else if (error instanceof NotFoundError) {
			sendErrorResponse(res, 404, error.message);
		} else {
			next(new DatabaseError('Failed to retrieve client.', error));
		}
	}
};

/**
 * Retrieve client by their phone number.
 * @param {object} req - The request object containing the client phone number in params.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - If there is an error during the appointment retrieval process.
 */
exports.getClientByPhoneNumber = async (req, res, next) => {
	const phoneNumber = req.params.phoneNumber;
	try {
		// Validate phone number
		if (!Client.validatePhone(phoneNumber)) {
			throw new ValidationError('Invalid phone number.');
		}

		const client = await Client.findByPhoneNumber(phoneNumber);
		// Check if the client exists
		if (!client) {
			throw new NotFoundError('Client not found.');
		}

		sendSuccessResponse(res, 200, 'Client retrieved successfully.', client);
	} catch (error) {
		if (error instanceof ValidationError) {
			sendErrorResponse(res, 400, error.message);
		} else if (error instanceof NotFoundError) {
			sendErrorResponse(res, 404, error.message);
		} else {
			next(new DatabaseError('Failed to retrieve client.', error));
		}
	}
};

/**
 * Retrieve client by their email.
 * @param {object} req - The request object containing the client email in params.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - If there is an error during the appointment retrieval process.
 */
exports.getClientByEmail = async (req, res, next) => {
	const email = req.params.email;
	try {
		// Validate email
		if (!Client.validateEmail(email)) {
			throw new ValidationError('Invalid email address.');
		}

		const client = await Client.findByEmail(email);
		// Check if the client exists
		if (!client) {
			throw new NotFoundError('Client not found.');
		}

		sendSuccessResponse(res, 200, 'Client retrieved successfully.', client);
	} catch (error) {
		if (error instanceof ValidationError) {
			sendErrorResponse(res, 400, error.message);
		} else if (error instanceof NotFoundError) {
			sendErrorResponse(res, 404, error.message);
		} else {
			next(new DatabaseError('Failed to retrieve client.', error));
		}
	}
};
