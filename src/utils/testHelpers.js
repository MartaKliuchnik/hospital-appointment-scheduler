const Client = require('../models/client');
const Doctor = require('../models/doctor');
const Appointment = require('../models/appointment');

/**
 * Utility function to create test data instances with default values.
 * @param {Function} Model - The class constructor (Client, Doctor, Appointment).
 * @param {Object} mockData - Default mock data for the model.
 * @param {Object} [overrides={}] - Optional values to override the default attributes.
 * @returns {Object} - A new instance of the specified model.
 */
function createTestInstance(Model, mockData, overrides = {}) {
	const data = { ...mockData, ...overrides };

	if (Model === Client) {
		return new Client(
			data.firstName,
			data.lastName,
			data.phoneNumber,
			data.email,
			data.password,
			data.role,
			data.clientId
		);
	} else if (Model === Doctor) {
		return new Doctor(
			data.firstName,
			data.lastName,
			data.specialization,
			data.isActive,
			data.doctorId
		);
	} else if (Model === Appointment) {
		return new Appointment(
			data.clientId,
			data.doctorId,
			data.appointmentTime,
			data.appointmentStatus,
			data.deletedAt
		);
	} else {
		throw new Error('Unsupported model type.');
	}
}

/**
 * Utility function for creating test clients.
 * @param {Object} mockClientData - Default values for client attributes.
 * @param {Object} [overrides={}] - Optional values to override the default attributes.
 * @returns {Client} - A new instance of the Client class.
 */
exports.createTestClient = (mockClientData, overrides = {}) => {
	return createTestInstance(Client, mockClientData, overrides);
};

/**
 * Utility function for creating test doctors.
 * @param {Object} mockClientData - Default values for doctor attributes.
 * @param {Object} [overrides={}] - Optional values to override the default attributes.
 * @returns {Doctor} - A new instance of the Doctor class.
 */
exports.createTestDoctor = (mockDoctorData, overrides = {}) => {
	return createTestInstance(Doctor, mockDoctorData, overrides);
};

/**
 * Utility function for creating test appointments.
 * @param {Object} mockClientData - Default values for appointment attributes.
 * @param {Object} [overrides={}] - Optional values to override the default attributes.
 * @returns {Appointment} - A new instance of the Appointment class.
 */
exports.createTestAppointment = (mockAppointmentData, overrides = {}) => {
	return createTestInstance(Appointment, mockAppointmentData, overrides);
};
