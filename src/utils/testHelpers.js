const Client = require('../models/client');
const Doctor = require('../models/doctor');
const Appointment = require('../models/appointment');

/**
 * Utility function for creating test clients.
 * @param {Object} mockClientData - Default values for client attributes.
 * @param {Object} [overrides={}] - Optional values to override the default attributes.
 * @returns {Client} - A new instance of the Client class.
 */
exports.createTestClient = (mockClientData, overrides = {}) => {
	return new Client(
		overrides.firstName || mockClientData.firstName,
		overrides.lastName || mockClientData.lastName,
		overrides.phoneNumber || mockClientData.phoneNumber,
		overrides.email || mockClientData.email,
		overrides.password || mockClientData.password,
		overrides.role || mockClientData.role,
		overrides.clientId || mockClientData.clientId
	);
};

/**
 * Utility function for creating test doctors.
 * @param {Object} mockClientData - Default values for doctor attributes.
 * @param {Object} [overrides={}] - Optional values to override the default attributes.
 * @returns {Doctor} - A new instance of the Doctor class.
 */
exports.createTestDoctor = (mockDoctorData, overrides = {}) => {
	return new Doctor(
		overrides.firstName || mockDoctorData.firstName,
		overrides.lastName || mockDoctorData.lastName,
		overrides.specialization || mockDoctorData.specialization,
		overrides.isActive || mockDoctorData.isActive,
		overrides.doctorId || mockDoctorData.doctorId
	);
};

/**
 * Utility function for creating test appointments.
 * @param {Object} mockClientData - Default values for appointment attributes.
 * @param {Object} [overrides={}] - Optional values to override the default attributes.
 * @returns {Appointment} - A new instance of the Appointment class.
 */
exports.createTestAppointment = (mockAppointmentData, overrides = {}) => {
	return new Appointment(
		overrides.clientId || mockAppointmentData.clientId,
		overrides.doctorId || mockAppointmentData.doctorId,
		overrides.appointmentTime || mockAppointmentData.appointmentTime,
		overrides.appointmentStatus || mockAppointmentData.appointmentStatus,
		overrides.deletedAt || mockAppointmentData.deletedAt,
		overrides.appointmentId || mockAppointmentData.appointmentId
	);
};
