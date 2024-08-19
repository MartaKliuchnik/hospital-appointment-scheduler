const Role = require('../../src/enums/Role');
const appointmentController = require('../../src/controllers/appointments');
const validations = require('../../src/utils/validations');
const responseHandlers = require('../../src/utils/responseHandlers');
const Appointment = require('../../src/models/appointment');
const Status = require('../../src/enums/Status');
const { createTestAppointment } = require('../../src/utils/testHelpers');
const {
	ValidationError,
	NotFoundError,
	AuthenticationError,
	DatabaseError,
} = require('../../src/utils/customErrors');

// Mock dependencies to isolate unit tests
jest.mock('../../src/utils/responseHandlers'); // Controls response handling
jest.mock('../../src/utils/validations'); // Simulates validation outcomes
jest.mock('../../src/models/appointment'); // Mocks the Appointment model to prevent database interaction

/**
 * Test suite for Appointment controllers.
 * This suite tests functionalities like updating, deleting, and retrieving appointments.
 */
describe('Appointment controller', () => {
	let res, req, next, mockAppointmentData;

	beforeEach(() => {
		req = { params: {}, body: {}, client: {} };
		res = { status: jest.fn().mockReturnThis, json: jest.fn() };
		next = jest.fn();
		mockAppointmentData = {
			clientId: 1,
			doctorId: 2,
			appointmentTime: '2024-08-20T10:00:00Z',
			appointmentStatus: Status.SCHEDULED,
			appointmentId: 3,
		};
	});

	afterEach(() => {
		jest.clearAllMocks(); // Clears all mocks after each test
	});

	// Tests for creating a new appointment
	describe('Creating an appointment', () => {
		it('should create an appointment successfully', async () => {
			const mockInputData = {
				doctorId: 2,
				appointmentTime: '2024-08-20T10:00:00Z',
			};
			req.client = { clientId: 1, role: Role.PATIENT };
			req.body = mockInputData;

			validations.validateAppointmentCreation.mockImplementation(() => {}); // Mock validation success
			// Mock the insertAppointment method to return an appointment ID (3)
			jest
				.spyOn(Appointment.prototype, 'insertAppointment')
				.mockResolvedValue(3); // Mock successful appointment insertion
			Appointment.getAppointmentById.mockResolvedValue(mockAppointmentData); // Mock successful appointment retrieval
			// Mock the static formatAppointmentResponse method
			Appointment.formatAppointmentResponse = jest
				.fn()
				.mockImplementation((appointment) => ({
					...appointment,
					appointmentTime: new Date(appointment.appointmentTime)
						.toISOString()
						.replace('T', ' ')
						.substring(0, 19),
				}));

			await appointmentController.createAppointment(req, res, next);

			// Verify that the validation function was called with the correct arguments
			expect(validations.validateAppointmentCreation).toHaveBeenCalledWith(
				1,
				2,
				'2024-08-20T10:00:00Z',
				'PATIENT'
			);
			// Ensures the insert method is called to create the appointment
			expect(Appointment.prototype.insertAppointment).toHaveBeenCalled();
			// Verify that methods was called with the correct data
			expect(Appointment.getAppointmentById).toHaveBeenCalledWith(3);
			expect(Appointment.formatAppointmentResponse).toHaveBeenCalledWith(
				mockAppointmentData
			);

			const expectedFormattedAppointment = {
				...mockAppointmentData,
				appointmentTime: '2024-08-20 10:00:00',
			};

			// Verify that the sendSuccessResponse function was called with the correct arguments
			expect(responseHandlers.sendSuccessResponse).toHaveBeenCalledWith(
				res,
				201,
				'Appointment created successfully.',
				expectedFormattedAppointment
			);
		});

		it('should handle validation error for invalid appointment time', async () => {
			req.body = { doctorId: 2, appointmentTime: 'invalid' };
			req.client = { clientId: 1, role: Role.PATIENT };

			// Mock the validation to throw a ValidationError for the invalid appointment time
			validations.validateAppointmentCreation.mockRejectedValue(
				new ValidationError(
					'Invalid appointment time. Please choose a future date and time.'
				)
			);

			await appointmentController.createAppointment(req, res, next);

			// Expect the sendErrorResponse to be called with the appropriate error message and status
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				400,
				'Invalid appointment time. Please choose a future date and time.'
			);
		});

		it("should handle validation error if the doctor doesn't exist", async () => {
			req.body = { doctorId: 999, appointmentTime: '2024-08-20T10:00:00Z' };
			req.client = { clientId: 1, role: Role.PATIENT };

			// Mock the validation to throw a NotFoundError for the non-existing doctor
			validations.validateAppointmentCreation.mockRejectedValue(
				new NotFoundError('Doctor not found.')
			);

			await appointmentController.createAppointment(req, res, next);

			// Expect the sendErrorResponse to be called with the appropriate error message and status
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				404,
				'Doctor not found.'
			);
		});

		it("should handle validation error if the client doesn't exist", async () => {
			req.body = { doctorId: 2, appointmentTime: '2024-08-20T10:00:00Z' };
			req.client = { clientId: 999, role: Role.PATIENT };

			// Mock the validation to throw a NotFoundError for the non-existing client
			validations.validateAppointmentCreation.mockRejectedValue(
				new NotFoundError('Client not found.')
			);

			await appointmentController.createAppointment(req, res, next);

			// Expect the sendErrorResponse to be called with the appropriate error message and status
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				404,
				'Client not found.'
			);
		});

		it('should handle validation error if doctorId and appointmentTime are not provided', async () => {
			req.body = { doctorId: '', appointmentTime: '' };
			req.client = { clientId: 1, role: Role.PATIENT };

			// Mock the validation to throw a ValidationError for missing parameters
			validations.validateAppointmentCreation.mockRejectedValue(
				new ValidationError(
					'Invalid request: doctorId and appointmentTime are required parameters.'
				)
			);

			await appointmentController.createAppointment(req, res, next);

			// Expect the sendErrorResponse to be called with the appropriate error message and status
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				400,
				'Invalid request: doctorId and appointmentTime are required parameters.'
			);
		});

		it('should handle authentication error', async () => {
			req.body = { doctorId: 2, appointmentTime: '2024-08-20T10:00:00Z' };
			req.client = { clientId: null, role: Role.PATIENT };

			// Mock the validation function to reject with an AuthenticationError due to the missing clientId
			validations.validateAppointmentCreation.mockRejectedValue(
				new AuthenticationError('Authentication failed: Missing client ID.')
			);

			await appointmentController.createAppointment(req, res, next);

			// Expect the sendErrorResponse to be called with status 401 (Unauthorized) and the appropriate error message
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				401,
				'Authentication failed: Missing client ID.'
			);
		});

		it('should handle database error', async () => {
			req.body = { doctorId: 2, appointmentTime: '2024-08-20T10:00:00Z' };
			req.client = { clientId: 1, role: Role.PATIENT };

			validations.validateAppointmentCreation.mockResolvedValue(); // Mock validation success
			Appointment.prototype.insertAppointment.mockRejectedValue(
				new Error('Database error')
			); // Mock database error

			await appointmentController.createAppointment(req, res, next);

			// Ensures the next middleware is called with a database error for proper error handling
			expect(next).toHaveBeenCalledWith(expect.any(DatabaseError));
			expect(next.mock.calls[0][0].message).toBe(
				'Failed to create appointment.'
			);
		});
	});
});
