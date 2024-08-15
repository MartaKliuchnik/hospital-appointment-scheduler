const Role = require('../../src/enums/Role');
const adminController = require('../../src/controllers/admin');
const responseHandlers = require('../../src/utils/responseHandlers');
const { createTestClient } = require('../../src/utils/testHelpers');
const Client = require('../../src/models/client');
const Appointment = require('../../src/models/appointment');
const { pool } = require('../../src/utils/database');

// Mock dependencies to isolate unit tests
jest.mock('../../src/utils/responseHandlers'); // Controls response handling
jest.mock('../../src/models/client'); // Avoids real database operations
jest.mock('../../src/models/appointment');
jest.mock('../../src/utils/database');

/**
 * Test suite for Admin controllers.
 * Includes tests for updating, deletion and retrieving clients.
 */
describe('Admin contoroller', () => {
	let req, res, next, mockClientData;

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

	// Clear any mocks after each test to avoid interference between tests.
	afterEach(() => {
		jest.clearAllMocks();
	});

	// Tests for updating the role of a client
	describe('Update user role', () => {
		it('should update user role successfully ', async () => {
			const clientId = 1;
			const newRole = Role.ADMIN;
			req.params = { clientId };
			req.body = { newRole };

			const mockClient = createTestClient(mockClientData);
			Client.findById = jest.fn().mockReturnValue(mockClient);
			mockClient.updateUserRole = jest.fn().mockReturnValue(true);

			await adminController.updateUserRole(req, res, next);
			// The role should be updated and reflected in the client instance
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
		expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
			res,
			400,
			'Invalid client ID.'
		);
	});

	it('should handle non-existent client', async () => {
		req.params = { clientId: 9999 };
		req.body = { newRole: Role.ADMIN };

		Client.findById = jest.fn().mockReturnValue(null);

		await adminController.updateUserRole(req, res, next);

		expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
			res,
			404,
			'Client not found.'
		);
	});

	it('should handle invalid role', async () => {
		req.params = { clientId: 1 };
		req.body = { newRole: 'INVALID_ROLE' };

		const mockClient = createTestClient(mockClientData);
		Client.findById = jest.fn().mockResolvedValue(mockClient);

		await adminController.updateUserRole(req, res, next);

		expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
			res,
			400,
			'Invalid role. Please provide a valid role from the allowed list.'
		);
	});

	// Tests for deletion the specified client
	describe('Delete client', () => {
		it('', () => {});
	});
});
