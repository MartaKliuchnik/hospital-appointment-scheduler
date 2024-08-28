const Appointment = require('../../src/models/appointment');

const {
	formatClientAppointmentsResponse,
	formatDoctorScheduleResponse,
} = require('../../src/utils/formatResponse');

// Mock the Appointment.formatAppointmentResponse method
jest.mock('../../src/models/appointment', () => ({
	formatAppointmentResponse: jest.fn(),
}));

/**
 * Test suite for formatting utility functions.
 * Includes tests for formatClientAppointmentsResponse, formatDoctorScheduleResponse, and formatSingleSchedule functions.
 */
describe('Formating utility functions', () => {
	// Clear any mocks after each test to avoid interference between tests.
	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('Formating a clients appointments response', () => {
		it('should remove redundant clientId from appointments and format them correctly', () => {
			const serverResponse = {
				clientId: 1,
				appointments: [
					{ appointmentId: 5, doctorId: 1, clientId: 1 },
					{ appointmentId: 6, doctorId: 3, clientId: 1 },
				],
			};

			// Mock the Appointment.formatAppointmentResponse method
			Appointment.formatAppointmentResponse.mockImplementation(
				(appointment) => ({
					...appointment,
				})
			);

			const result = formatClientAppointmentsResponse(serverResponse);

			// Check that the result matches the expected output
			expect(result).toEqual({
				clientId: 1,
				appointments: [
					{ appointmentId: 5, doctorId: 1 },
					{ appointmentId: 6, doctorId: 3 },
				],
			});

			// Verify that formatAppointmentResponse was called twice
			expect(Appointment.formatAppointmentResponse).toHaveBeenCalledTimes(2);
		});
	});

	describe('Format Doctor Schedule Response', () => {
		it('should correctly format doctor schedule response by removing redundant doctorId and formatting schedules', () => {
			const serverResponse = [
				{ doctorId: 1, scheduleDay: 'MONDAY' },
				{ doctorId: 1, scheduleDay: 'FRIDAY' },
			];

			// Mock the formatSingleSchedule function to simply return the schedule object
			jest
				.spyOn(
					require('../../src/utils/formatResponse'),
					'formatSingleSchedule'
				)
				.mockImplementation((schedule) => ({ ...schedule }));

			const result = formatDoctorScheduleResponse(serverResponse);

			// Check that the doctorId is correctly extracted from the first schedule
			expect(result.doctorId).toBe(1);

			// Check that the schedules are formatted correctly
			expect(result).toEqual({
				doctorId: 1,
				schedules: [{ scheduleDay: 'MONDAY' }, { scheduleDay: 'FRIDAY' }],
			});
		});
	});
});
