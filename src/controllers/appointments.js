const path = require('path');
const rootDir = require('../utils/path');
const Appointment = require('../models/appointment');
const Client = require('../models/client');
const { appendFile } = require('fs');

exports.getAppointments = (req, res) => {
	res.sendFile(path.join(rootDir, '../views', 'schedule-page.html'));
};

exports.createAppointment = async (req, res) => {
	// Check authentication
	if (!req.client || !req.client.clientId) {
		return res.status(401).json({
			error:
				'Authentication failed: Ensure that the correct authentication token is provided in the request header.',
		});
	}

	const { doctorId, appointmentTime } = req.body;
	const clientId = req.client.clientId;

	// Check for missing parameters
	if (!clientId || !doctorId || !appointmentTime) {
		return res.status(400).json({
			error:
				'Invalid request: Missing required parameters. Please provide clientId, doctorId, and appointmentTime.',
		});
	}

	try {
		// Check if client exists
		const clientExists = await Client.findById(clientId);
		if (!clientExists) {
			return res.status(404).json({ error: 'Client not found.' });
		}

		// Check if doctor exists
		// const doctorExists = await Doctor.findById(doctorId);
		// if (!doctorExists) {
		// 	return res.status(404).json({ error: 'Doctor not found.' });
		// }

		const appointment = new Appointment(clientId, doctorId, appointmentTime);

		// Validate appointment time
		if (!appointment.isValidAppointmentTime()) {
			return res.status(400).json({
				error:
					'Cannot schedule appointments in the past. Please choose a future date and time.',
			});
		}

		const appointmentId = await appointment.insertAppointment();
		const appointmentDetails = await appointment.getAppointmentById(
			appointmentId
		);

		res.status(201).json({
			message: 'Appointment created successfully',
			appointment: appointmentDetails,
		});
	} catch (error) {
		console.error('Error creating appointment:', error);
		res
			.status(500)
			.json({ error: 'An error occurred while creating the appointment.' });
	}
};

exports.getClientAppointments = async (req, res) => {
	const clientId = req.params.clientId;

	// Check if the clientId is provided and is a valid number
	if (!clientId || isNaN(parseInt(clientId))) {
		return res.status(400).json({ error: 'Invalid client ID' });
	}

	try {
		const result = await Appointment.getAppointmentsByClientId(
			parseInt(clientId)
		);

		// Check if the appointments exist for this client
		if (!result.appointments || result.appointments.length === 0) {
			return res
				.status(404)
				.json({ message: 'No appointments found for this client' });
		}

		const response = {
			clientId: result.clientId,
			appointments: result.appointments.map((appointment) => ({
				appointmentId: appointment.appointmentId,
				doctorId: appointment.doctorId,
				appointmentTime: appointment.appointmentTime
					.toISOString()
					.replace('T', ' ')
					.substring(0, 19),
				appointmentStatus: appointment.appointmentStatus,
			})),
		};

		res.status(200).json(response);
	} catch (error) {
		console.error('Error processing client appointments:', error);
		res.status(500).json({ error: 'Failed to retrieve client appointments.' });
	}
};
