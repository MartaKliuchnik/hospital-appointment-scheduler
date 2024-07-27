const path = require('path');
const rootDir = require('../utils/path');
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
} = require('../utils/validations');
const {
	sendSuccessResponse,
	sendErrorResponse,
} = require('../utils/responseHandlers');

/**
 * Serve the schedule page.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {undefined} - This function does not return a value.
 */
exports.listAppointments = (req, res) => {
	res.sendFile(path.join(rootDir, '../views', 'schedule-page.html'));
};

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

	try {
		await validateAppointmentCreation(clientId, doctorId, appointmentTime);

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

		const result = await Appointment.getAppointmentsByClientId(clientId);

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

		await Appointment.deleteAppointmentById(appointmentId, clientRole);
		sendSuccessResponse(
			res,
			200,
			clientRole === 'ADMIN'
				? 'Appointment deleted successfully.'
				: 'Appointment canceled successfully.'
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
			next(new DatabaseError('Failed to delete appointment.', error));
		}
	}
};

/**
 * Update an appointment for a specific ID.
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
