const path = require('path');
const rootDir = require('../utils/path');
const Appointment = require('../models/appointment');
const Client = require('../models/client');
const Doctor = require('../models/doctor');
const { formatClientAppointmentsResponse } = require('../utils/formatResponse');

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
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - If there is an error during the appointment creation process.
 */
exports.createAppointment = async (req, res) => {
	const { doctorId, appointmentTime } = req.body;
	const clientId = req.client?.clientId;

	// Check authentication
	if (!clientId) {
		return res.status(401).json({
			error: 'Authentication failed: Missing client ID.',
		});
	}

	// Check for missing parameters
	if (!doctorId || !appointmentTime) {
		return res.status(400).json({
			error:
				'Invalid request: doctorId, and appointmentTime are required parameters.',
		});
	}

	try {
		// Check if client exists
		const clientExists = await Client.findById(clientId);
		if (!clientExists) {
			return res.status(404).json({ error: 'Client not found.' });
		}

		// Check if doctor exists
		const doctorExists = await Doctor.getById(doctorId);
		if (!doctorExists) {
			return res.status(404).json({ error: 'Doctor not found.' });
		}

		// Validate appointment time
		if (!Appointment.isValidAppointmentTime(appointmentTime)) {
			return res.status(400).json({
				error:
					'Invalid appointment time. Please choose a future date and time.',
			});
		}

		const appointment = new Appointment(clientId, doctorId, appointmentTime);
		const appointmentId = await appointment.insertAppointment();

		// Fetch and format appointment details
		const appointmentDetails = await Appointment.getAppointmentById(
			appointmentId
		);
		const formattedAppointment =
			Appointment.formatAppointmentResponse(appointmentDetails);

		const response = {
			message: 'Appointment created successfully.',
			appointment: formattedAppointment,
		};

		res.status(201).json(response);
	} catch (error) {
		console.error('Error creating appointment:', error);

		// Check specific error messages to return detailed error response
		if (
			error.message.includes('The selected appointment time is not available.')
		) {
			return res.status(400).json({ error: error.message });
		}

		res
			.status(500)
			.json({ error: 'An error occurred while creating the appointment.' });
	}
};

/**
 * Retrieve appointments for a specific client.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - If there is an error during the appointment retrieval process.
 */
exports.getClientAppointments = async (req, res) => {
	const clientId = parseInt(req.params.clientId);
	const currentClient = req.client.clientId;

	// Check if the appointment belongs to the client
	if (currentClient !== clientId && req.client.role !== 'ADMIN') {
		return res.status(403).json({
			error: 'You have permission to view only your own appointments.',
		});
	}

	// Check if the clientId is provided and is a valid number
	if (isNaN(clientId)) {
		return res.status(400).json({ error: 'Invalid client ID.' });
	}

	try {
		const result = await Appointment.getAppointmentsByClientId(clientId);

		// Check if the appointments exist for this client
		if (!result.appointments || result.appointments.length === 0) {
			return res
				.status(404)
				.json({ message: 'No appointments found for this client.' });
		}

		const response = formatClientAppointmentsResponse(result);
		res.status(200).json(response);
	} catch (error) {
		console.error('Error processing client appointments:', error);
		res.status(500).json({
			error: "An error occurred while retrieving the client's appointment.",
		});
	}
};

/**
 * Delete or cancel an appointment for a specific ID.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - If there is an error during the appointment deletion process.
 */
exports.deleteAppointment = async (req, res) => {
	const appointmentId = parseInt(req.params.appointmentId);
	const clientId = req.client.clientId;
	const clientRole = req.client.role;

	// Check authentication
	if (!clientId) {
		return res.status(401).json({
			error: 'Authentication failed: Missing client ID.',
		});
	}

	// Check if the appointmentId is provided and is a valid number
	if (isNaN(appointmentId)) {
		return res.status(400).json({ error: 'Invalid appointment ID.' });
	}

	try {
		const appointment = await Appointment.getAppointmentById(appointmentId);

		// Check if the appointment exists
		if (!appointment) {
			return res.status(404).json({ error: 'Appointment not found.' });
		}

		// Check if the appointment belongs to the client
		if (appointment.clientId !== clientId) {
			return res.status(403).json({
				error: 'You do not have permission to delete this appointment.',
			});
		}

		await Appointment.deleteAppointmentById(appointmentId, clientRole);
		res
			.status(200)
			.json({
				message:
					clientRole === 'ADMIN'
						? 'Appointment deleted successfully.'
						: 'Appointment canceled successfully.',
			});
	} catch (error) {
		console.error('Error deleting client appointments:', error);

		if (error.message === 'Appointment not found.') {
			return res.status(404).json({ error: error.message });
		}

		res.status(500).json({
			error: "An error occurred while deleting the client's appointment.",
		});
	}
};

/**
 * Update an appointment for a specific ID.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - If there is an error during the appointment updating process.
 */
exports.updateAppointment = async (req, res) => {
	const appointmentId = parseInt(req.params.appointmentId);
	const { appointmentTime } = req.body;
	const clientId = req.client.clientId;

	// Check authentication
	if (!clientId) {
		return res.status(401).json({
			error: 'Authentication failed: Missing client ID.',
		});
	}

	// Check if the appointmentId is provided and is a valid number
	if (isNaN(appointmentId)) {
		return res.status(400).json({ error: 'Invalid appointment ID.' });
	}

	try {
		const appointment = await Appointment.getAppointmentById(appointmentId);

		// Check if the appointment exists
		if (!appointment) {
			return res.status(404).json({ error: "Appointment doesn't exist." });
		}

		// Check if the appointment belongs to the client
		if (appointment.clientId !== clientId && req.client.role !== 'ADMIN') {
			return res.status(403).json({
				error: 'You do not have permission to update this appointment.',
			});
		}

		// Validate appointment time
		if (!Appointment.isValidAppointmentTime(appointmentTime)) {
			return res.status(400).json({
				error:
					'Invalid appointment time. Please choose a future date and time.',
			});
		}

		const updatedAppointment = await Appointment.changeAppointmentById(
			appointmentTime,
			appointmentId
		);

		res.status(200).json({
			message: 'Appointment updated successfully.',
			appointment: Appointment.formatAppointmentResponse(updatedAppointment),
		});
	} catch (error) {
		console.error('Error updating client appointment:', error);

		if (error.message === 'The selected appointment time is not available.') {
			return res.status(400).json({ error: error.message });
		}

		res.status(500).json({
			error: "An error occurred while updating the client's appointment.",
		});
	}
};
