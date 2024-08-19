const Role = require('../../src/enums/Role');
const appointmentController = require('../../src/controllers/appointments');
const validations = require('../../src/utils/validations');
const responseHandlers = require('../../src/utils/responseHandlers');
const Appointment = require('../../src/models/appointment');
const Status = require('../../src/enums/Status');
const { pool } = require('../../src/utils/database');
const {
	ValidationError,
	NotFoundError,
	AuthenticationError,
	DatabaseError,
} = require('../../src/utils/customErrors');
const { createTestAppointment } = require('../../src/utils/testHelpers');

// Mock dependencies to isolate unit tests
jest.mock('../../src/utils/responseHandlers'); // Controls response handling
jest.mock('../../src/utils/validations'); // Simulates validation outcomes
jest.mock('../../src/models/appointment'); // Mocks the Appointment model to prevent database interaction
jest.mock('../../src/utils/database'); // Mocks the database module

/**
 * Test suite for Appointment controllers.
 * This suite tests functionalities like updating, deleting, and retrieving appointments.
 */
describe('Appointment controller', () => {
	let res, req, next, mockAppointmentData, mockConnection;

	beforeEach(() => {
		req = {
			params: { appointmentId: 3 },
			body: {},
			client: { clientId: 1, role: 'PATIENT' },
		};
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
			expect(Appointment.getAppointmentById).toHaveBeenCalledWith(3, 'PATIENT');
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

			validations.validateAppointmentCreation.mockResolvedValue(); // Mock validation success
			Appointment.prototype.insertAppointment.mockRejectedValue(
				new Error('Database error')
			); // Mock database error

			await appointmentController.createAppointment(req, res, next);

			// Ensure the next middleware is called with a database error
			expect(next).toHaveBeenCalledWith(expect.any(DatabaseError));
			expect(next.mock.calls[0][0].message).toBe(
				'Failed to create appointment.'
			);
		});
	});

	// Tests for retrieving appointments for a specific client
	describe('Retrieve appointments for a specific client', () => {
		it('should retrieve appointments successfully', async () => {
			req.params.clientId = 1;

			const mockListAppointments = [
				mockAppointmentData,
				{ ...mockAppointmentData, appointmentId: 4 },
			];

			// Mock the validation functions to bypass actual validation logic
			validations.validateClientAppointmentAccess.mockImplementation(() => {});
			validations.validateClientId.mockImplementation(() => {});
			// Mock the Appointment.getAppointmentsByClientId method to return mock data
			Appointment.getAppointmentsByClientId.mockResolvedValue({
				appointments: mockListAppointments,
			});

			await appointmentController.getClientAppointments(req, res, next);

			// Verify that the validation function was called with the correct arguments and a success response is sent with the appointments data
			expect(Appointment.getAppointmentsByClientId).toHaveBeenCalledWith(
				1,
				'PATIENT'
			);

			expect(responseHandlers.sendSuccessResponse).toHaveBeenCalledWith(
				res,
				200,
				'Appointments retrieved successfully.',
				expect.anything()
			);
		});

		it('should handle case when no appointments are found', async () => {
			req.params.clientId = 1;

			// Mock the validation functions to bypass actual validation logic
			validations.validateClientAppointmentAccess.mockImplementation(() => {});
			validations.validateClientId.mockImplementation(() => {});
			// Mock scenario where no appointments are found
			Appointment.getAppointmentsByClientId.mockResolvedValue({
				appointments: [],
			});

			await appointmentController.getClientAppointments(req, res, next);

			// Ensures an error response is sent indicating the appointment was not found
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				404,
				'No appointments found for this client.'
			);
		});

		it('should handle authentication error', async () => {
			req.params.clientId = 1;
			req.client = { clientId: 4, role: Role.PATIENT };

			// Mock the validation function to reject with an AuthenticationError due to the missing clientId
			validations.validateAppointmentCreation.mockRejectedValue(
				new AuthenticationError(
					'You have permission to view only your own appointments.'
				)
			);

			await appointmentController.createAppointment(req, res, next);

			// Expect the sendErrorResponse to be called with status 401 (Unauthorized) and the appropriate error message
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				401,
				'You have permission to view only your own appointments.'
			);
		});

		it('should handle validation error if the client ID is invalid', async () => {
			req.params.clientId = 1;
			req.client = { clientId: 'invalid', role: Role.PATIENT };

			// Mock the validation to throw a ValidationError for invalid clientId
			validations.validateAppointmentCreation.mockRejectedValue(
				new NotFoundError('Invalid client ID.')
			);

			await appointmentController.createAppointment(req, res, next);

			// Expect the sendErrorResponse to be called with the appropriate error message and status
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				404,
				'Invalid client ID.'
			);
		});

		it('should handle database error', async () => {
			req.params.clientId = 1;

			// Mock the validation functions to bypass actual validation logic
			validations.validateClientAppointmentAccess.mockImplementation(() => {});
			validations.validateClientId.mockImplementation(() => {});
			// Mock database error
			Appointment.getAppointmentsByClientId.mockRejectedValue(
				new Error('Database error')
			);

			await appointmentController.getClientAppointments(req, res, next);

			// Ensure the next middleware is called with a database error
			expect(next).toHaveBeenCalledWith(expect.any(DatabaseError));
			expect(next.mock.calls[0][0].message).toBe(
				'Failed to retrieve client appointments.'
			);
		});
	});

	// Tests for deleting or canceling an appointment by ID
	describe('Deleting or canceling an appointment', () => {
		beforeEach(() => {
			mockConnection = {
				beginTransaction: jest.fn(),
				commit: jest.fn(),
				rollback: jest.fn(),
				release: jest.fn(),
				execute: jest.fn(),
			};
			pool.getConnection.mockResolvedValue(mockConnection);
		});

		it('should successfully cancel an appointment for a patient', async () => {
			validations.validateAppointmentDeletion.mockResolvedValue(() => {}); // Mock validation success
			// Mock successful cancellation of appointment status in the database
			Appointment.updateAppointmentStatus.mockResolvedValue({
				affectedRows: 1,
			});

			await appointmentController.deleteAppointment(req, res, next);

			// Verify that the appointment status was updated to CANCELED
			expect(Appointment.updateAppointmentStatus).toHaveBeenCalledWith(
				3,
				Status.CANCELED
			);
			// Verify that the success response was sent with a 200 status and success message
			expect(responseHandlers.sendSuccessResponse).toHaveBeenCalledWith(
				res,
				200,
				'Appointment canceled successfully.'
			);
			// Ensure that the transaction was committed
			expect(mockConnection.commit).toHaveBeenCalled();
		});

		it('should successfully soft delete an appointment for an admin', async () => {
			req.client.role = 'ADMIN';

			validations.validateAppointmentDeletion.mockImplementation(() => {}); // Mock validation success
			// Mock successful soft deletion of appointment in the database
			Appointment.softDeleteAppointment.mockResolvedValue({
				affectedRows: 1,
			});

			await appointmentController.deleteAppointment(req, res, next);

			// Verify that the appointment was soft deleted with the mock connection
			expect(Appointment.softDeleteAppointment).toHaveBeenCalledWith(
				3,
				mockConnection
			);
			// Verify that the success response was sent with a 200 status and success message
			expect(responseHandlers.sendSuccessResponse).toHaveBeenCalledWith(
				res,
				200,
				'Appointment soft deleted successfully.'
			);
			// Ensure that the transaction was committed
			expect(mockConnection.commit).toHaveBeenCalled();
		});

		it('should handle authentication error due to missing client ID', async () => {
			req.client = { clientId: null };

			// Mock validation function to reject with an AuthenticationError
			validations.validateAppointmentDeletion.mockRejectedValue(
				new AuthenticationError('Authentication failed: Missing client ID.')
			);

			await appointmentController.deleteAppointment(req, res, next);

			// Expect an error response with status 401 and the authentication error message
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				401,
				'Authentication failed: Missing client ID.'
			);
		});

		it('should handle validation error for an invalid appointment ID', async () => {
			req.params.appointmentId = 'invalid';

			// Mock validation function to reject with a ValidationError
			validations.validateAppointmentDeletion.mockRejectedValue(
				new ValidationError('Invalid appointment ID.')
			);

			await appointmentController.deleteAppointment(req, res, next);

			// Expect an error response with status 400 and the validation error message
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				400,
				'Invalid appointment ID.'
			);
		});

		it('should handle NotFoundError if the appointment does not exist', async () => {
			req.params.appointmentId = 999;

			// Mock validation function to reject with a NotFoundError
			validations.validateAppointmentDeletion.mockRejectedValue(
				new NotFoundError('Appointment not found.')
			);

			await appointmentController.deleteAppointment(req, res, next);

			// Expect an error response with status 404 and the not found error message
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				404,
				'Appointment not found.'
			);
		});

		it('should handle authentication error if client lacks permission to delete appointment', async () => {
			req.params.clientId = 1;
			req.client = { clientId: 4, role: Role.PATIENT };

			// Mock validation function to reject with an AuthenticationError
			validations.validateAppointmentDeletion.mockRejectedValue(
				new AuthenticationError(
					'You do not have permission to delete this appointment.'
				)
			);

			await appointmentController.deleteAppointment(req, res, next);

			// Expect an error response with status 401 and the permission error message
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				401,
				'You do not have permission to delete this appointment.'
			);
		});

		it('should handle database error during appointment deletion', async () => {
			validations.validateAppointmentDeletion.mockImplementation(() => {}); // Mock validation success
			// Mock a database error during appointment status update
			Appointment.updateAppointmentStatus.mockRejectedValue(
				new Error('Database error')
			);

			await appointmentController.deleteAppointment(req, res, next);

			// Ensure the next middleware is called with a database error
			expect(next).toHaveBeenCalledWith(expect.any(DatabaseError));
			expect(next.mock.calls[0][0].message).toBe(
				'Failed to delete/cancel appointment.'
			);
		});
	});

	// Tests for updating the appointment time for a specific appointment
	describe('Updating an specific appointment', () => {
		it('should update an appointment successfully', async () => {
			req.body = { appointmentTime: '2024-08-28T14:00:00Z' };
			const updateAppointment = {
				...mockAppointmentData,
				appointmentTime: '2024-08-28T14:00:00Z',
			};

			validations.validateAppointmentUpdate.mockImplementation(() => {}); // Mock validation success
			Appointment.changeAppointmentById.mockResolvedValue(updateAppointment); // Mock changing appointment sucessfully
			// Mock the database method to change the appointment by ID
			Appointment.formatAppointmentResponse = jest
				.fn()
				.mockImplementation((appointment) => ({
					...appointment,
					appointmentTime: new Date(appointment.appointmentTime)
						.toISOString()
						.replace('T', ' ')
						.substring(0, 19),
				}));

			await appointmentController.updateAppointment(req, res, next);

			// Verify that the validation function was called with the correct parameters
			expect(validations.validateAppointmentUpdate).toHaveBeenCalledWith(
				3,
				1,
				'2024-08-28T14:00:00Z',
				'PATIENT'
			);
			// Verify that the method to change the appointment was called with the correct parameters
			expect(Appointment.changeAppointmentById).toHaveBeenCalledWith(
				'2024-08-28T14:00:00Z',
				3
			);
			// Verify that the formatAppointmentResponse method was called with the updated appointment
			expect(Appointment.formatAppointmentResponse).toHaveBeenCalledWith(
				updateAppointment
			);

			const expectedFormattedAppointment = {
				...updateAppointment,
				appointmentTime: '2024-08-28 14:00:00',
			};

			// Verify that the success response was sent with the correct status and message
			expect(responseHandlers.sendSuccessResponse).toHaveBeenCalledWith(
				res,
				200,
				'Appointment updated successfully.',
				expectedFormattedAppointment
			);
		});

		it('should handle authentication error due to missing client ID', async () => {
			req.client = { clientId: null }; // Set client ID to null to simulate authentication failure

			// Mock validation function to reject with an AuthenticationError
			validations.validateAppointmentUpdate.mockRejectedValue(
				new AuthenticationError('Authentication failed: Missing client ID.')
			);

			await appointmentController.updateAppointment(req, res, next);

			// Expect an error response with status 401 and the specific authentication error message
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				401,
				'Authentication failed: Missing client ID.'
			);
		});

		it('should handle validation error for an invalid appointment ID', async () => {
			req.params.appointmentId = 'invalid'; // Set invalid appointment ID to simulate validation failure

			// Mock validation function to reject with a ValidationError
			validations.validateAppointmentUpdate.mockRejectedValue(
				new ValidationError('Invalid appointment ID.')
			);

			await appointmentController.updateAppointment(req, res, next);

			// Expect an error response with status 400 and the validation error message
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				400,
				'Invalid appointment ID.'
			);
		});

		it('should handle validation error for an invalid appointment time', async () => {
			req.params.appointmentTime = '2022-08-28T14:00:00Z'; // Set invalid appointment time to simulate validation failure

			// Mock validation function to reject with a ValidationError
			validations.validateAppointmentUpdate.mockRejectedValue(
				new ValidationError(
					'Invalid appointment time. Please choose a future date and time.'
				)
			);

			await appointmentController.updateAppointment(req, res, next);

			// Expect an error response with status 400 and the validation error message
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				400,
				'Invalid appointment time. Please choose a future date and time.'
			);
		});

		it('should handle NotFoundError if the appointment does not exist', async () => {
			req.params.appointmentId = 999; // Set non-existent appointment ID to simulate NotFoundError

			// Mock validation function to reject with a NotFoundError
			validations.validateAppointmentUpdate.mockRejectedValue(
				new NotFoundError("Appointment doesn't exist.")
			);

			await appointmentController.updateAppointment(req, res, next);

			// Expect an error response with status 404 and the not found error message
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				404,
				"Appointment doesn't exist."
			);
		});

		it('should handle authentication error if client lacks permission to update appointment', async () => {
			req.params.clientId = 1;
			req.client = { clientId: 4, role: Role.PATIENT }; // Set client ID and role to simulate lack of permission

			// Mock validation function to reject with an AuthenticationError
			validations.validateAppointmentUpdate.mockRejectedValue(
				new AuthenticationError(
					'You do not have permission to update this appointment.'
				)
			);

			await appointmentController.updateAppointment(req, res, next);

			// Expect an error response with status 401 and the permission error message
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				401,
				'You do not have permission to update this appointment.'
			);
		});

		it('should handle database error during appointment update', async () => {
			validations.validateAppointmentUpdate.mockImplementation(() => {}); // Mock validation success
			// Mock a database error during changing an appointment
			Appointment.changeAppointmentById.mockRejectedValue(
				new Error('Database error')
			);

			await appointmentController.updateAppointment(req, res, next);

			// Ensure the next middleware is called with a database error
			expect(next).toHaveBeenCalledWith(expect.any(DatabaseError));
			expect(next.mock.calls[0][0].message).toBe(
				'Failed to change appointment.'
			);
		});
	});
});

