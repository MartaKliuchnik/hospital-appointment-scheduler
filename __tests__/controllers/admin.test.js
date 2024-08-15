const Role = require('../../src/enums/Role');
const adminController = require('../../src/controllers/admin');
const responseHandlers = require('../../src/utils/responseHandlers');
const { createTestClient } = require('../../src/utils/testHelpers');
const Client = require('../../src/models/client');
const Appointment = require('../../src/models/appointment');
const { pool } = require('../../src/utils/database');
const {
	DatabaseError,
	ValidationError,
} = require('../../src/utils/customErrors');

// Mock dependencies to isolate unit tests
jest.mock('../../src/utils/responseHandlers'); // Controls response handling
jest.mock('../../src/models/client'); // Avoids real database operations
jest.mock('../../src/models/appointment'); // Mocks the Appointment model to prevent database interaction
jest.mock('../../src/utils/database'); // Mocks the database module

/**
 * Test suite for Admin controllers.
 * This suite tests functionalities like updating, deleting, and retrieving clients.
 */
describe('Admin contoroller', () => {
	let req, res, next, mockClientData, mockConnection;

	// Tests for updating the role of a client
	describe('Update user role', () => {
		beforeEach(() => {
			req = { body: {} };
			res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
			next = jest.fn();
			responseHandlers.sendSuccessResponse.mockClear();
			mockClientData = {
				clientId: 1,
				firstName: 'Carlos',
				lastName: 'Gonzalez',
				phoneNumber: '+1(456)555-0123',
				email: 'gonzalez@example.com',
				password: 'Gonzalez123',
				role: Role.PATIENT,
				registrationDate: '2024-07-31T11:32:38.000Z',
				deletedAt: null,
			};
		});

		afterEach(() => {
			jest.clearAllMocks(); // Clears all mocks after each test
		});

		it('should update user role successfully ', async () => {
			const clientId = 1;
			const newRole = Role.ADMIN;
			req.params = { clientId };
			req.body = { newRole };

			const mockClient = createTestClient(mockClientData);
			Client.findById = jest.fn().mockReturnValue(mockClient);
			mockClient.updateUserRole = jest.fn().mockReturnValue(true);

			await adminController.updateUserRole(req, res, next);
			// Verifies that the client ID was used to find the client and that the role was updated
			expect(Client.findById).toHaveBeenCalledWith(clientId);
			expect(mockClient.updateUserRole).toHaveBeenCalledWith(newRole);
			expect(responseHandlers.sendSuccessResponse).toHaveBeenCalledWith(
				res,
				200,
				'User role updated successfully.',
				{
					newRole,
				}
			);
		});
	});

	it('should handle invalid client ID', async () => {
		req.params = { clientId: 'invalid' };

		await adminController.updateUserRole(req, res, next);
		// Ensures that an error response is sent for an invalid client ID
		expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
			res,
			400,
			'Invalid client ID.'
		);
	});

	it('should handle non-existent client', async () => {
		req.params = { clientId: 9999 }; // Sets a non-existent client ID
		req.body = { newRole: Role.ADMIN };

		Client.findById = jest.fn().mockReturnValue(null);

		await adminController.updateUserRole(req, res, next);
		// Ensures that an error response is sent when the client is not found
		expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
			res,
			404,
			'Client not found.'
		);
	});

	it('should handle invalid role', async () => {
		req.params = { clientId: 1 };
		req.body = { newRole: 'INVALID_ROLE' }; // Sets an invalid role

		const mockClient = createTestClient(mockClientData);
		Client.findById = jest.fn().mockResolvedValue(mockClient);

		await adminController.updateUserRole(req, res, next);
		// Ensures that an error response is sent when the role is invalid
		expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
			res,
			400,
			'Invalid role. Please provide a valid role from the allowed list.'
		);
	});

	// Tests for deleting the specified client
	describe('Delete client', () => {
		beforeEach(() => {
			req = {
				params: { clientId: 1 },
				query: {}, // Mocks the query parameters (used for hard delete)
			};
			res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
			next = jest.fn();
			mockConnection = {
				beginTransaction: jest.fn(),
				commit: jest.fn(),
				rollback: jest.fn(),
				release: jest.fn(),
			};
			pool.getConnection.mockResolvedValue(mockConnection);
		});

		afterEach(() => {
			jest.clearAllMocks(); // Clears all mocks after each test
		});

		it('should soft delete a client successfully', async () => {
			// Scenario: Client is found and has no appointments; a soft delete is performed
			const mockClient = { clientId: 1 };
			Client.findById.mockResolvedValue(mockClient);

			Appointment.getAppointmentsByClientId.mockResolvedValue({
				appointments: [],
			});
			Client.softDelete.mockResolvedValue(true);

			await adminController.deleteClient(req, res, next);
			// Ensures the soft delete method is called and the transaction is committed
			expect(Client.softDelete).toHaveBeenCalledWith(1, mockConnection);
			expect(mockConnection.commit).toHaveBeenCalled();
			expect(responseHandlers.sendSuccessResponse).toHaveBeenCalledWith(
				res,
				200,
				'Client soft deleted successfully.'
			);
		});

		it('should hard delete a client successfully', async () => {
			// Scenario: Client is found and has no appointments; a hard delete is performed
			req.query.hardDelete = 'true';
			const mockClient = { clientId: 1 };
			Client.findById.mockResolvedValue(mockClient);

			Appointment.getAppointmentsByClientId.mockResolvedValue({
				appointments: [],
			});
			Client.hardDelete.mockResolvedValue(true);

			await adminController.deleteClient(req, res, next);
			// Ensures the hard delete method is called and the transaction is committed
			expect(Client.hardDelete).toHaveBeenCalledWith(1, mockConnection);
			expect(mockConnection.commit).toHaveBeenCalled();
			expect(responseHandlers.sendSuccessResponse).toHaveBeenCalledWith(
				res,
				200,
				'Client hard deleted successfully.'
			);
		});

		it('should handle invalid client ID', async () => {
			req.params.clientId = 'invalid'; // Sets an invalid client ID

			await adminController.deleteClient(req, res, next);
			// Ensures the transaction is rolled back and an error response is sent
			expect(mockConnection.rollback).toHaveBeenCalled();
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				400,
				'Invalid client ID.'
			);
		});

		it('should handle client with existing appointments', async () => {
			// Scenario: Client is found but has existing appointments; deletion is forbidden
			const mockClient = { clientId: 1 };
			Client.findById.mockResolvedValue(mockClient);
			Appointment.getAppointmentsByClientId.mockResolvedValue({
				appointments: [
					{
						appointmentId: 4,
					},
				],
			});

			await adminController.deleteClient(req, res, next);
			// Ensures the transaction is rolled back and an error response is sent
			expect(mockConnection.rollback).toHaveBeenCalled();
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				409,
				'This client has appointment(s). Deletion is forbidden.'
			);
		});

		it('should handle non-existent client', async () => {
			Client.findById.mockResolvedValue(null);
			Appointment.getAppointmentsByClientId.mockResolvedValue({
				appointments: [],
			});

			await adminController.deleteClient(req, res, next);
			// Ensures the transaction is rolled back and an error response is sent
			expect(mockConnection.rollback).toHaveBeenCalled();
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				404,
				'Client not found.'
			);
		});

		it('should handle database error during deletion', async () => {
			const mockClient = { clientId: 1 };
			Client.findById.mockResolvedValue(mockClient);
			Appointment.getAppointmentsByClientId.mockResolvedValue({
				appointments: [],
			});
			Client.softDelete.mockRejectedValue(new Error('Database error'));

			await adminController.deleteClient(req, res, next);
			// Ensures the next middleware is called with the database error
			expect(next).toHaveBeenCalledWith(expect.any(DatabaseError));
		});
	});

	// Tests for retrieving list of clients
	describe('Retrieve list of clients', () => {
		beforeEach(() => {
			req = { params: {}, query: {} };
			res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
			next = jest.fn();
		});

		afterEach(() => {
			jest.clearAllMocks(); // Clears all mocks after each test
		});

		it('should retrieve clients successfully', async () => {
			const mockListClients = createTestClient(mockClientData, {
				clientId: 2,
				firstName: 'Jane',
			});
			Client.getAll.mockResolvedValue(mockListClients);

			await adminController.listClients(req, res, next);
			// Ensures the getAll method is called and a success response is sent with the clients
			expect(Client.getAll).toHaveBeenCalled();
			expect(responseHandlers.sendSuccessResponse).toHaveBeenCalledWith(
				res,
				200,
				'Clients retrieved successfully.',
				mockListClients
			);
		});

		it('should handle case when no clients are found', async () => {
			Client.getAll.mockResolvedValue([]);

			await adminController.listClients(req, res, next);
			// Ensures an error response is sent indicating no clients were found
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				404,
				'No clients found in the database.'
			);
		});

		it('should handle database error', async () => {
			Client.getAll.mockRejectedValue(new Error('Database error'));

			await adminController.listClients(req, res, next);
			// Ensures the next middleware is called with the database error
			expect(next).toHaveBeenCalledWith(expect.any(DatabaseError));
		});
	});

	// Tests for retrieving client by their ID.
	describe('Retrieve client by ID', () => {
		it('should retrieve a client by ID successfully', async () => {
			const mockClient = createTestClient(mockClientData);
			req.params.clientId = '1';
			Client.findById.mockResolvedValue(mockClient);

			await adminController.getClientById(req, res, next);
			// Ensures the findById method is called with the correct client ID and a success response is sent with the client data
			expect(Client.findById).toHaveBeenCalledWith(1);
			expect(responseHandlers.sendSuccessResponse).toHaveBeenCalledWith(
				res,
				200,
				'Client retrieved successfully.',
				mockClient
			);
		});

		it('should handle non-existent client', async () => {
			// Scenario: A valid client ID is provided, but no client is found with that ID
			req.params.clientId = '999';
			Client.findById.mockResolvedValue(null);

			await adminController.getClientById(req, res, next);
			// Ensures an error response is sent indicating the client was not found
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				404,
				'Client not found.'
			);
		});

		it('should handle database error', async () => {
			// Scenario: A valid client ID is provided, but a database error occurs during the retrieval process
			req.params.clientId = '1';

			Client.findById.mockRejectedValue(new Error('Database error'));

			await adminController.getClientById(req, res, next);
			// Ensures the next middleware is called with the database error
			expect(next).toHaveBeenCalledWith(expect.any(DatabaseError));
		});
	});

	// Tests for retrieving client by their phone number.
	describe('Retrieve client by phone number', () => {
		it('should retrieve a client by phone number successfully', async () => {
			const mockClient = createTestClient(mockClientData);
			req.params.phoneNumber = '+1(456)555-0123';

			jest.spyOn(Client, 'validatePhone').mockReturnValue(true);
			Client.findByPhoneNumber.mockResolvedValue(mockClient);

			await adminController.getClientByPhoneNumber(req, res, next);
			// Ensures the findByPhoneNumber method is called with the correct phone number and a success response is sent with the client data
			expect(Client.findByPhoneNumber).toHaveBeenCalledWith('+1(456)555-0123');
			expect(responseHandlers.sendSuccessResponse).toHaveBeenCalledWith(
				res,
				200,
				'Client retrieved successfully.',
				mockClient
			);
		});

		it('should handle invalid client phone number', async () => {
			// Scenario: An invalid phone number format is provided, and the validation fails
			req.params.phoneNumber = 'invalid';
			jest.spyOn(Client, 'validatePhone').mockReturnValue(false);

			await adminController.getClientByPhoneNumber(req, res, next);
			// Ensures an error response is sent indicating an invalid phone number
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				400,
				'Invalid phone number.'
			);
		});

		it('should handle non-existent client', async () => {
			// Scenario: A valid phone number format is provided, but no client is found with that phone number
			req.params.phoneNumber = '+1(222)333-4444';
			jest.spyOn(Client, 'validatePhone').mockReturnValue(true);

			Client.findByPhoneNumber.mockResolvedValue(null);

			await adminController.getClientByPhoneNumber(req, res, next);
			// Ensures an error response is sent indicating the client was not found
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				404,
				'Client not found.'
			);
		});

		it('should handle database error', async () => {
			// Scenario: A valid phone number is provided, but a database error occurs during the retrieval process
			req.params.phoneNumber = '+1(456)555-0123';
			jest.spyOn(Client, 'validatePhone').mockReturnValue(true);

			Client.findByPhoneNumber.mockRejectedValue(new Error('Database error'));

			await adminController.getClientByPhoneNumber(req, res, next);
			// Ensures the next middleware is called with the database error
			expect(next).toHaveBeenCalledWith(expect.any(DatabaseError));
		});
	});

	// Tests for retrieving client by their email.
	describe('Retrieve client by email', () => {
		it('should retrieve a client by email successfully', async () => {
			const mockClient = createTestClient(mockClientData);
			req.params.email = 'gonzalez@example.com';

			jest.spyOn(Client, 'validateEmail').mockReturnValue(true);
			Client.findByEmail.mockResolvedValue(mockClient);

			await adminController.getClientByEmail(req, res, next);
			// Ensures the findByEmail method is called with the correct email and a success response is sent with the client data
			expect(Client.findByEmail).toHaveBeenCalledWith('gonzalez@example.com');
			expect(responseHandlers.sendSuccessResponse).toHaveBeenCalledWith(
				res,
				200,
				'Client retrieved successfully.',
				mockClient
			);
		});

		it('should handle invalid client email', async () => {
			// Scenario: An invalid email format is provided, and the validation fails
			req.params.email = 'invalid';
			jest.spyOn(Client, 'validateEmail').mockReturnValue(false);

			await adminController.getClientByEmail(req, res, next);
			// Ensures an error response is sent indicating an invalid email address
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				400,
				'Invalid email address.'
			);
		});

		it('should handle non-existent client', async () => {
			// Scenario: A valid email format is provided, but no client is found with that email
			req.params.email = 'invalid@example.com';
			jest.spyOn(Client, 'validateEmail').mockReturnValue(true);

			Client.findByEmail.mockResolvedValue(null);

			await adminController.getClientByEmail(req, res, next);
			// Ensures an error response is sent indicating the client was not found
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				404,
				'Client not found.'
			);
		});

		it('should handle database error', async () => {
			// Scenario: A valid email is provided, but a database error occurs during the retrieval process
			req.params.email = 'gonzalez@example.com';
			jest.spyOn(Client, 'validateEmail').mockReturnValue(true);

			Client.findByEmail.mockRejectedValue(new Error('Database error'));

			await adminController.getClientByEmail(req, res, next);
			// Ensures the next middleware is called with the database error
			expect(next).toHaveBeenCalledWith(expect.any(DatabaseError));
		});
	});
});
