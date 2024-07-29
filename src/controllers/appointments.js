const Appointment = require('../models/appointment');
const { formatClientAppointmentsResponse } = require('../utils/formatResponse');
const {
	NotFoundError,
	AuthenticationError,
	ValidationError,
	DatabaseError,
	AuthorizationError,
} = require('../utils/customErrors');

const {
	validateAppointmentCreation,
	validateClientAppointmentAccess,
	validateAppointmentDeletion,
	validateAppointmentUpdate,
	validateClientId,
} = require('../utils/validations');
const {
	sendSuccessResponse,
	sendErrorResponse,
} = require('../utils/responseHandlers');
const Status = require('../enums/Status');
const { pool } = require('../utils/database');

/**
 * Create a new appointment.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - If there is an error during the appointment creation process.
 */
exports.createAppointment = async (req, res, next) => {
	const { doctorId, appointmentTime } = req.body;
	const clientId = req.client?.clientId;
	const clientRole = req.client?.role;

	try {
		await validateAppointmentCreation(
			clientId,
			doctorId,
			appointmentTime,
			clientRole
		);

		const appointment = new Appointment(clientId, doctorId, appointmentTime);
		const appointmentId = await appointment.insertAppointment();

		const appointmentDetails = await Appointment.getAppointmentById(
			appointmentId
		);
		const formattedAppointment =
			Appointment.formatAppointmentResponse(appointmentDetails);

		sendSuccessResponse(
			res,
			201,
			'Appointment created successfully.',
			formattedAppointment
		);
	} catch (error) {
		if (error instanceof NotFoundError) {
			sendErrorResponse(res, 404, error.message);
		} else if (error instanceof AuthenticationError) {
			sendErrorResponse(res, 401, error.message);
		} else if (error instanceof ValidationError) {
			sendErrorResponse(res, 400, error.message);
		} else {
			next(new DatabaseError('Failed to create appointment.', error));
		}
	}
};

/**
 * Retrieve appointments for a specific client.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - If there is an error during the appointment retrieval process.
 */
exports.getClientAppointments = async (req, res, next) => {
	const clientId = parseInt(req.params.clientId);
	const currentClient = req.client.clientId;

	try {
		validateClientAppointmentAccess(clientId, currentClient, req.client.role);
		await validateClientId(clientId);

		const result = await Appointment.getAppointmentsByClientId(
			clientId,
			req.client.role
		);

		// Check if the appointments exist for this client
		if (!result.appointments || result.appointments.length === 0) {
			return sendErrorResponse(
				res,
				404,
				'No appointments found for this client.'
			);
		}

		const response = formatClientAppointmentsResponse(result);
		sendSuccessResponse(
			res,
			200,
			'Appointments retrieved successfully.',
			response
		);
	} catch (error) {
		if (error instanceof AuthorizationError) {
			sendErrorResponse(res, 403, error.message);
		} else if (error instanceof ValidationError) {
			sendErrorResponse(res, 400, error.message);
		} else if (error instanceof NotFoundError) {
			sendErrorResponse(res, 404, error.message);
		} else {
			next(new DatabaseError('Failed to retrieve client appointments.', error));
		}
	}
};

/**
 * Delete or cancel an appointment for a specific ID.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - If there is an error during the appointment deletion process.
 */
exports.deleteAppointment = async (req, res, next) => {
	const appointmentId = parseInt(req.params.appointmentId);
	const clientId = req.client.clientId;
	const clientRole = req.client.role;

	try {
		await validateAppointmentDeletion(appointmentId, clientId, clientRole);

		const connection = await pool.getConnection();
		await connection.beginTransaction();

		try {
			if (clientRole === 'ADMIN') {
				await Appointment.softDeleteAppointment(appointmentId, connection);
			} else {
				await Appointment.updateAppointmentStatus(
					appointmentId,
					Status.CANCELED
				);
			}

			await connection.commit();
			sendSuccessResponse(
				res,
				200,
				clientRole === 'ADMIN'
					? 'Appointment soft deleted successfully.'
					: 'Appointment canceled successfully.'
			);
		} catch (error) {
			await connection.rollback();
			throw error;
		} finally {
			connection.release();
		}
	} catch (error) {
		if (error instanceof AuthenticationError) {
			sendErrorResponse(res, 401, error.message);
		} else if (error instanceof AuthorizationError) {
			sendErrorResponse(res, 403, error.message);
		} else if (error instanceof ValidationError) {
			sendErrorResponse(res, 400, error.message);
		} else if (error instanceof NotFoundError) {
			sendErrorResponse(res, 404, error.message);
		} else {
			next(new DatabaseError('Failed to delete/cancel appointment.', error));
		}
	}
};

/**
 * Update an appointmentTime for a specific appointment.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - If there is an error during the appointment updating process.
 */
exports.updateAppointment = async (req, res, next) => {
	const appointmentId = parseInt(req.params.appointmentId);
	const { appointmentTime } = req.body;

	try {
		await validateAppointmentUpdate(
			appointmentId,
			req.client.clientId,
			appointmentTime,
			req.client.role
		);

		const updatedAppointment = await Appointment.changeAppointmentById(
			appointmentTime,
			appointmentId
		);

		const response = Appointment.formatAppointmentResponse(updatedAppointment);
		sendSuccessResponse(
			res,
			200,
			'Appointment updated successfully.',
			response
		);
	} catch (error) {
		if (error instanceof AuthenticationError) {
			sendErrorResponse(res, 401, error.message);
		} else if (error instanceof AuthorizationError) {
			sendErrorResponse(res, 403, error.message);
		} else if (error instanceof ValidationError) {
			sendErrorResponse(res, 400, error.message);
		} else if (error instanceof NotFoundError) {
			sendErrorResponse(res, 404, error.message);
		} else {
			next(new DatabaseError('Failed to change appointment.', error));
		}
	}
};
