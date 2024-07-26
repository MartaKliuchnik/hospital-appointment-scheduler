const Role = require('../enums/Role');
const WeekDay = require('../enums/WeekDay');
const Appointment = require('../models/appointment');
const Client = require('../models/client');
const Doctor = require('../models/doctor');
const {
	AuthenticationError,
	ValidationError,
	NotFoundError,
	AuthorizationError,
	ConflictError,
} = require('./customErrors');

const validateRegistrationInput = async (
	firstName,
	lastName,
	phoneNumber,
	email,
	password
) => {
	// Check if firstName, lastName, phoneNumber, email, password exist
	if (!firstName || !lastName || !phoneNumber || !email || !password) {
		throw new ValidationError(
			'All fields are required and must be in a valid format.'
		);
	}

	// Validate email
	if (!Client.validateEmail(email)) {
		throw new ValidationError('Invalid email address.');
	}

	const isClientExist = await Client.findByEmail(email);
	// Check if client with this email exists
	if (isClientExist) {
		throw new ConflictError('Email already in use.');
	}

	const isPhoneNumberExist = await Client.findByPhoneNumber(phoneNumber);
	// Check if client with this number exists
	if (isPhoneNumberExist) {
		throw new ConflictError('Phone number already in use.');
	}
};

const validateLoginInput = (email, password) => {
	// Check if email and password exist
	if (!email || !password) {
		throw new ValidationError('Email and password are required.');
	}
};

const validateUserRoleUpdate = async (clientId, newRole) => {
	// Check if the clientId is provided and is a valid number
	if (isNaN(clientId)) {
		throw new ValidationError('Invalid client ID.');
	}

	// Check if client exists
	const client = await Client.findById(clientId);
	if (!client) {
		throw new NotFoundError('Client not found.');
	}

	// Check for missing parameters and valid role
	if (!newRole || !Object.values(Role).includes(newRole)) {
		throw new ValidationError('Invalid role. Please provide a valid role from the allowed list.');
	}

	// Check if the new role is different from the current role
	if (client.role === newRole) {
		throw new ValidationError('Client already has this role.');
	}

	return client;
};

const validateAppointmentCreation = async (
	clientId,
	doctorId,
	appointmentTime
) => {
	// Check authentication
	if (!clientId) {
		throw new AuthenticationError('Authentication failed: Missing client ID.');
	}

	// Check if the doctorId and appointmentTime are provided
	if (!doctorId || !appointmentTime) {
		throw new ValidationError(
			'Invalid request: doctorId and appointmentTime are required parameters.'
		);
	}

	// Check if the client exists
	const clientExists = await Client.findById(clientId);
	if (!clientExists) {
		throw new NotFoundError('Client not found.');
	}

	// Check if the doctor exists
	const doctorExists = await Doctor.getById(doctorId);
	if (!doctorExists) {
		throw new NotFoundError('Doctor not found.');
	}

	// Validate appointment time
	if (!Appointment.isValidAppointmentTime(appointmentTime)) {
		throw new ValidationError(
			'Invalid appointment time. Please choose a future date and time.'
		);
	}
};

const validateClientAppointmentAccess = (clientId, currentClient, role) => {
	// Check if the appointment belongs to the client
	if (currentClient !== clientId && role !== 'ADMIN') {
		throw new AuthorizationError(
			'You have permission to view only your own appointments.'
		);
	}

	// Check if the clientId is provided and is a valid number
	if (isNaN(clientId)) {
		throw new ValidationError('Invalid client ID.');
	}
};

const validateAppointmentDeletion = async (appointmentId, clientId) => {
	// Check authentication
	if (!clientId) {
		throw new AuthenticationError('Authentication failed: Missing client ID.');
	}

	// Check if the appointmentId is provided and is a valid number
	if (isNaN(appointmentId)) {
		throw new ValidationError('Invalid appointment ID.');
	}

	const appointment = await Appointment.getAppointmentById(appointmentId);
	// Check if the appointment exists
	if (!appointment) {
		throw new NotFoundError('Appointment not found.');
	}

	// Check if the appointment belongs to the client
	if (appointment.clientId !== clientId) {
		throw new AuthorizationError(
			'You do not have permission to delete this appointment.'
		);
	}
};

const validateAppointmentUpdate = async (
	appointmentId,
	clientId,
	appointmentTime,
	role
) => {
	// Check authentication
	if (!clientId) {
		throw new AuthenticationError('Authentication failed: Missing client ID.');
	}

	// Check if the appointmentId is provided and is a valid number
	if (isNaN(appointmentId)) {
		throw new ValidationError('Invalid appointment ID.');
	}

	const appointment = await Appointment.getAppointmentById(appointmentId);
	// Check if the appointment exists
	if (!appointment) {
		throw new NotFoundError("Appointment doesn't exist.");
	}

	// Check if the appointment belongs to the client
	if (appointment.clientId !== clientId && role !== 'ADMIN') {
		throw new AuthorizationError(
			'You do not have permission to update this appointment.'
		);
	}

	// Validate appointment time
	if (!Appointment.isValidAppointmentTime(appointmentTime)) {
		throw new ValidationError(
			'Invalid appointment time. Please choose a future date and time.'
		);
	}
};

const validateDoctorId = (doctorId) => {
	// Check if the doctorId is provided and is a valid number
	if (isNaN(doctorId)) {
		throw new ValidationError('Invalid doctor ID.');
	}
};

const validateScheduleId = (scheduleId) => {
	// Check if the scheduleId is provided and is a valid number
	if (isNaN(scheduleId)) {
		throw new ValidationError('Invalid schedule ID.');
	}
};

const validateClientId = async (clientId) => {
	// If we have a clientId
	const client = await Client.findById(clientId);
	if (!client) {
		return res.status(404).json({ error: 'Client not found.' });
	}
};

const validateCreatingScheduleInput = (
	doctorId,
	scheduleDay,
	startTime,
	endTime
) => {
	// Check for missing parameters
	if (!doctorId || !scheduleDay || !startTime || !endTime) {
		throw new ValidationError(
			'All fields are required and must be in a valid format.'
		);
	}

	if (!Object.keys(WeekDay).includes(scheduleDay)) {
		throw new ValidationError(
			'Invalid scheduleDay. Please provide a valid scheduleDay from the allowed list.'
		);
	}

	// Check if the doctorId is provided and is a valid number
	if (isNaN(doctorId)) {
		throw new ValidationError('Invalid doctor ID.');
	}
};

module.exports = {
	validateLoginInput,
	validateUserRoleUpdate,
	validateRegistrationInput,
	validateAppointmentCreation,
	validateClientAppointmentAccess,
	validateAppointmentDeletion,
	validateAppointmentUpdate,
	validateDoctorId,
	validateScheduleId,
	validateClientId,
	validateCreatingScheduleInput,
};
