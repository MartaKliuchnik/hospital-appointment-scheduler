const Client = require('../models/client');
const Doctor = require('../models/doctor');

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
exports.createTestDoctor = (mockClientData, overrides = {}) => {
	return new Doctor(
		overrides.firstName || mockClientData.firstName,
		overrides.lastName || mockClientData.lastName,
		overrides.specialization || mockClientData.specialization,
		overrides.isActive || mockClientData.isActive,
		overrides.doctorId || mockClientData.doctorId
	);
};
