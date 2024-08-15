const Client = require('../models/client');

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
