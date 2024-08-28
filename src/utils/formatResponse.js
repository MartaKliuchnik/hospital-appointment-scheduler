const Appointment = require('../models/appointment');

/**
 * Transforms the client appointment data by removing redundant clientId information from individual appointments.
 * @param {Object} serverResponse - The server response containing client appointments.
 * @returns {Object} - A new object with the client ID and a formatted list of appointments.
 */
const formatClientAppointmentsResponse = (serverResponse) => {
	const { clientId, appointments } = serverResponse;
	return {
		clientId,
		appointments: appointments.map(formatSingleAppointment),
	};
};

/**
 * Formats a single appointment by removing the clientId and applying the Appointment.formatAppointmentResponse method.
 * @param {Object} appointment - The appointment object to format.
 * @returns {Object} - A formatted appointment object without the clientId.
 */
const formatSingleAppointment = (appointment) => {
	const { clientId, ...formattedAppointment } =
		Appointment.formatAppointmentResponse(appointment);
	console.log(`Client ID: ${clientId}`);
	return formattedAppointment;
};

/**s
 * Transforms the doctor schedule data by removing redundant doctorId information from individual schedules.
 * @param {Array} serverResponse - The server response containing doctor schedules.
 * @returns {Object} - A new object with the doctor ID and a formatted list of schedules.
 */
const formatDoctorScheduleResponse = (serverResponse) => {
	const [firstSchedule, ...restSchedule] = serverResponse;

	return {
		doctorId: firstSchedule.doctorId,
		schedules: [firstSchedule, ...restSchedule].map(formatSingleSchedule),
	};
};

/**
 * Formats a single schedule by removing the doctorId.
 * @param {Object} schedule - The schedule object to format.
 * @returns {Object} - A formatted schedule object without the doctorId.
 */
const formatSingleSchedule = (schedule) => {
	const { doctorId, ...formattedSchedule } = schedule;
	console.log(`Doctor ID: ${doctorId}`);
	return formattedSchedule;
};

module.exports = {
	formatClientAppointmentsResponse,
	formatDoctorScheduleResponse,
	formatSingleAppointment,
	formatSingleSchedule,
};
