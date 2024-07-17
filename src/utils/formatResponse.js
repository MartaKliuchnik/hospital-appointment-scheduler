const Appointment = require('../models/appointment');

/**
 * Transforms the client appointment data by removing redundant clientId information from individual appointments.
 * @param {Object} serverResponse - The server response containing client appointments.
 * @returns {Object} - A new object with the client ID and a formatted list of appointments.
 */
module.exports = function formatClientAppointmentsResponse(serverResponse) {
	return {
		clientId: serverResponse.clientId,
		appointments: serverResponse.appointments.map((appointment) => {
			const { clientId, ...formattedAppointment } =
				Appointment.formatAppointmentResponse(appointment);
			return formattedAppointment;
		}),
	};
};
