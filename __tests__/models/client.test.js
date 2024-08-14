const Role = require('../../src/enums/Role');
const Client = require('../../src/models/client');
const { comparePassword } = require('../../src/utils/auth');
const {
	DatabaseError,
	NotFoundError,
	ValidationError,
} = require('../../src/utils/customErrors');
const { pool } = require('../../src/utils/database');
const { createJWT } = require('../../src/utils/jwt');

// Mocked 'database' module to avoid real database queries during tests.
jest.mock('../../src/utils/database', () => ({
	pool: {
		execute: jest.fn(),
	},
}));

// Mocked 'auth' module to simulate password comparison without real authentication.
jest.mock('../../src/utils/auth', () => ({
	comparePassword: jest.fn(),
}));

// Mock 'jwt' module to avoid real auth token creation during tests
jest.mock('../../src/utils/jwt', () => ({
	createJWT: jest.fn(),
}));

/**
 * Utility function for creating test clients.
 * @param {Object} mockClientData - Default values for client attributes.
 * @param {Object} [overrides={}] - Optional values to override the default attributes.
 * @returns {Client} - A new instance of the Client class.
 */
const createTestClient = (mockClientData, overrides = {}) => {
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
 * Test suite for Client Model implementation.
 * Includes methods for registering, validating email, and constructing Client instances.
 */
describe('Client Model', () => {
	let mockClientData;
	beforeEach(() => {
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

	// Email validation tests
	describe('Email Validation', () => {
		it('should return true for valid email addresses', () => {
			expect(Client.validateEmail('gonzalez@example.com')).toBe(true);
			expect(Client.validateEmail('user.name@example.co.uk')).toBe(true);
		});

		it('should return false for invalid email addresses', () => {
			expect(Client.validateEmail('<name>@invalid-email')).toBe(false);
			expect(Client.validateEmail('test@example')).toBe(false);
		});
	});

	// Phone number validation tests
	describe('Prone number validation', () => {
		it('should return true for valid phone numbers', () => {
			expect(Client.validatePhone('+1(123)456-7890')).toBe(true);
			expect(Client.validatePhone('1234567890')).toBe(true);
		});

		it('should return false for invalid phone numbers', () => {
			expect(Client.validatePhone('1')).toBe(false);
			expect(Client.validatePhone('abc')).toBe(false);
		});
	});

	// Tests for the verifyPassword method
	describe('Password verification', () => {
		let client;
		const inputPassword = 'plainTextPassword';
		const hashedPassword = 'hashedPassword';

		beforeEach(() => {
			// Initialize a new Client instance with a hashed password
			client = new Client(
				'Carlos',
				'Gonzalez',
				'+1(456)555-0123',
				'gonzalez@example.com',
				hashedPassword
			);
		});

		it('should return true for a correct password', async () => {
			comparePassword.mockResolvedValue(true);
			const result = await client.verifyPassword(inputPassword);
			expect(result).toBe(true);
			expect(comparePassword).toHaveBeenCalledWith(
				inputPassword,
				hashedPassword
			);
		});

		it('should return false for an incorrect password', async () => {
			comparePassword.mockResolvedValue(false);
			const result = await client.verifyPassword(inputPassword);
			expect(result).toBe(false);
			expect(comparePassword).toHaveBeenCalledWith(
				inputPassword,
				hashedPassword
			);
		});

		it('should throw DatabaseError on comparePassword failure', async () => {
			comparePassword.mockRejectedValue(new Error('Comparison error'));
			await expect(client.verifyPassword(inputPassword)).rejects.toThrow(
				new DatabaseError('Error during authentication.')
			);
		});
	});

	// Client constructor tests
	describe('Constructor', () => {
		it('should create a new Client instance with default values', () => {
			const client = createTestClient(mockClientData);

			// Verify that the properties of the client instance are correctly set
			expect(client.firstName).toBe('Carlos');
			expect(client.lastName).toBe('Gonzalez');
			expect(client.phoneNumber).toBe('+1(456)555-0123');
			expect(client.email).toBe('gonzalez@example.com');
			expect(client.password).toBe('Gonzalez123');
			expect(client.role).toBe(Role.PATIENT);
			expect(client.deletedAt).toBeNull();
		});
	});

	// Client registration tests
	describe('Register', () => {
		it('should register a new client and return the new client ID', async () => {
			const mockInsertId = 1;
			pool.execute.mockResolvedValue([{ insertId: mockInsertId }]);

			const client = createTestClient(mockClientData);
			const result = await client.register();

			// Verify the correct client data was passed to the query and the result matches the mockInsertId
			expect(result).toBe(mockInsertId);
			expect(pool.execute).toHaveBeenCalledWith(expect.any(String), [
				'Carlos',
				'Gonzalez',
				'+1(456)555-0123',
				'gonzalez@example.com',
				'Gonzalez123',
				Role.PATIENT,
				null,
			]);
		});

		it('should throw DatabaseError on register failure', async () => {
			pool.execute.mockRejectedValue(new Error('Database error'));

			const client = createTestClient(mockClientData);

			// Expect a DatabaseError to be thrown when the registration fails
			await expect(client.register()).rejects.toThrow(
				new DatabaseError('Failed to register client.')
			);
		});
	});

	// Find a client by their email address tests
	describe('Find by email', () => {
		it('should return a Client instance when a client is found by email', async () => {
			pool.execute.mockResolvedValue([[mockClientData]]);

			const result = await Client.findByEmail('gonzalez@example.com');
			// Verify the correct client data was returned
			expect(result).toBeInstanceOf(Client);
			expect(result.clientId).toBe(mockClientData.clientId);
			expect(result.email).toBe(mockClientData.email);
		});

		it('should return null when client is not found', async () => {
			pool.execute.mockResolvedValue([[]]);

			const result = await Client.findByEmail('nonexistent@email.com');
			// Expect a null to be when client is not found
			expect(result).toBeNull();
		});

		it('should throw DatabaseError on findByEmail failure', async () => {
			pool.execute.mockRejectedValue(new Error('Database error'));

			// Expect a DatabaseError to be thrown when the findByEmail fails
			await expect(Client.findByEmail('gonzalez@example.com')).rejects.toThrow(
				new DatabaseError('Failed to find client by email.')
			);
		});
	});

	// Find a client by their ID tests
	describe('Find by ID', () => {
		it('should return a Client instance when a client is found by ID', async () => {
			pool.execute.mockResolvedValue([[mockClientData]]);

			const result = await Client.findById('1');

			// Verify the correct client data was returned
			expect(result).toBeInstanceOf(Client);
			expect(result.clientId).toBe(mockClientData.clientId);
			expect(result.email).toBe(mockClientData.email);
		});

		it('should return null when client is not found', async () => {
			pool.execute.mockResolvedValue([[]]);

			const result = await Client.findById(1);
			// Expect a null to be when client is not found
			expect(result).toBeNull();
		});

		it('should throw DatabaseError on findById failure', async () => {
			pool.execute.mockRejectedValue(new Error('Database error'));

			// Expect a DatabaseError to be thrown when the findById fails
			await expect(Client.findById(1)).rejects.toThrow(
				new DatabaseError('Failed to find client by ID.')
			);
		});
	});

	// Retrieve a list of all clients tests
	describe('Retrieve all clients', () => {
		it('should return a list of all clients', async () => {
			const mockListClients = [
				mockClientData,
				{
					clientId: 2,
					email: 'jane@example.com',
					phoneNumber: '+1(123)444-7890',
				},
			];
			pool.execute.mockResolvedValue([mockListClients]);

			const result = await Client.getAll();

			// Verify that the result contains the expected number of clients, and each client's data matches the mock data
			expect(result).toHaveLength(2);
			expect(result[0].clientId).toBe(mockListClients[0].clientId);
			expect(result[1].email).toBe(mockListClients[1].email);
		});

		it('should return null when no clients are found', async () => {
			pool.execute.mockResolvedValue([[]]);

			const result = await Client.getAll();
			// Expect a null to be returned when no clients are found
			expect(result).toBeNull();
		});

		it('should throw DatabaseError on getAll failure', async () => {
			pool.execute.mockRejectedValue(new Error('Database error'));

			// Expect a DatabaseError to be thrown when the getAll fails
			await expect(Client.getAll()).rejects.toThrow(
				new DatabaseError('Failed to retrieve clients.')
			);
		});
	});

	// Create an authentication token tests
	describe('Create JWT', () => {
		it('should create a JWT token', () => {
			const client = createTestClient(mockClientData);

			createJWT.mockReturnValue('mock.jwt.token');
			const token = client.createAuthToken();

			// Verify the token creation was successful and the correct parameters were used
			expect(token).toBe('mock.jwt.token');
			expect(createJWT).toHaveBeenCalledWith(
				{
					alg: 'HS256',
					typ: 'JWT',
				},
				expect.objectContaining({
					clientId: mockClientData.clientId,
					firstName: mockClientData.firstName,
					lastName: mockClientData.lastName,
					role: mockClientData.role,
				}),
				process.env.JWT_SECRET
			);
		});

		it('should throw DatabaseError on token creation failure', () => {
			createJWT.mockImplementation(() => {
				throw new Error('Token creation error.');
			});

			// Expect a DatabaseError to be thrown when token creation fails
			expect(() => {
				const client = createTestClient(mockClientData);
				client.createAuthToken();
			}).toThrow(new DatabaseError('Error creating authentication token.'));
		});
	});

	// Tests for removing sensitive information from client data
	describe('Safe-to-expose client data', () => {
		it('should return a safe object without sensitive information', () => {
			const client = createTestClient(mockClientData);

			const safeClientData = client.toSafeObject();
			// Password should not be exposed in the safe object
			expect(safeClientData.password).toBeUndefined();
		});
	});

	// Tests for updating the role of a client
	describe('Update client role', () => {
		it('should update user role successfully', async () => {
			const client = createTestClient(mockClientData);
			pool.execute.mockResolvedValue([{ affectedRows: 1 }]);
			const result = await client.updateUserRole(Role.ADMIN);
			// The role should be updated and reflected in the client instance
			expect(result).toBe(true);
			expect(client.role).toBe(Role.ADMIN);
		});

		it('should return false if role is already set to the new value', async () => {
			const client = createTestClient(mockClientData);
			const result = await client.updateUserRole(Role.PATIENT);
			// No database operation should occur if the role is unchanged
			expect(result).toBe(false);
			expect(pool.execute).not.toHaveBeenCalled();
		});

		it('should throw DatabaseError on updateUserRole failure', async () => {
			const client = createTestClient(mockClientData);

			pool.execute.mockRejectedValue(new Error('Database error'));
			// Expect a DatabaseError to be thrown with a specific message
			await expect(client.updateUserRole(Role.ADMIN)).rejects.toThrow(
				new DatabaseError('Failed to update user role.')
			);
		});
	});

	// Tests for finding a client by their phone number
	describe('Find by phone number', () => {
		it('should return a Client instance when a client is found by phone number', async () => {
			pool.execute.mockResolvedValue([[mockClientData]]);

			const result = await Client.findByPhoneNumber('+1(456)555-0123');
			// The result should be an instance of Client and have the correct phone number
			expect(result).toBeInstanceOf(Client);
			expect(result.phoneNumber).toBe('+1(456)555-0123');
		});

		it('should return null when client is not found', async () => {
			pool.execute.mockResolvedValue([[]]);
			const result = await Client.findByPhoneNumber('+1(456)555-0123');
			// The result should be null when no client is found
			expect(result).toBeNull();
		});

		it('should throw DatabaseError on findByPhoneNumber failure', async () => {
			pool.execute.mockRejectedValue(new Error('Database error'));
			// Expect a DatabaseError to be thrown with a specific message
			await expect(Client.findByPhoneNumber('+1(456)555-0123')).rejects.toThrow(
				new DatabaseError('Failed to find client by phone number.')
			);
		});
	});

	// Tests for soft deleting a specific client
	describe('Soft deletes client', () => {
		// Setup a mock connection object before each test
		beforeEach(() => {
			mockConnection = {
				execute: jest.fn(),
			};
		});

		it('should soft delete a client successfully', async () => {
			mockConnection.execute.mockResolvedValue([{ affectedRows: 1 }]);
			await Client.softDelete(1, mockConnection);
			// Verify that the correct SQL query was called with the right parameters
			expect(mockConnection.execute).toHaveBeenCalledWith(
				'UPDATE client SET deletedAt = NOW() WHERE clientId = ?',
				[1]
			);
		});

		it('should throw NotFoundError when client is not found', async () => {
			mockConnection.execute.mockResolvedValue([{ affectedRows: 0 }]);
			// Expect a NotFoundError if the client is not found
			await expect(Client.softDelete(1, mockConnection)).rejects.toThrow(
				new NotFoundError('Client not found.')
			);
		});

		it('should throw ValidationError when client has appointments', async () => {
			mockConnection.execute.mockRejectedValue({
				code: 'ER_ROW_IS_REFERENCED_2',
			});
			// Expect a ValidationError if the client has appointments
			await expect(Client.softDelete(1, mockConnection)).rejects.toThrow(
				new ValidationError(
					'This client has appointments. Deletion is forbidden.'
				)
			);
		});

		it('should throw DatabaseError on softDelete failure', async () => {
			mockConnection.execute.mockRejectedValue(new Error('Database error'));
			// Expect a DatabaseError on general softDelete failure
			await expect(Client.softDelete(1, mockConnection)).rejects.toThrow(
				new DatabaseError('Failed to delete client.')
			);
		});
	});

	// Tests for hard deleting a specific client
	describe('Hard deletes client', () => {
		// Setup a mock connection object before each test
		beforeEach(() => {
			mockConnection = {
				execute: jest.fn(),
			};
		});

		it('should hard delete a client successfully', async () => {
			mockConnection.execute.mockResolvedValue([{ affectedRows: 1 }]);
			await Client.hardDelete(1, mockConnection);
			// Verify that the correct SQL query was called with the right parameters
			expect(mockConnection.execute).toHaveBeenCalledWith(
				'DELETE FROM client WHERE clientId = ?',
				[1]
			);
		});

		it('should throw NotFoundError when client is not found', async () => {
			mockConnection.execute.mockResolvedValue([{ affectedRows: 0 }]);
			// Expect a NotFoundError if the client is not found
			await expect(Client.hardDelete(1, mockConnection)).rejects.toThrow(
				new NotFoundError('Client not found.')
			);
		});

		it('should throw DatabaseError on hardDelete failure', async () => {
			mockConnection.execute.mockRejectedValue(new Error('Database error'));
			// Expect a DatabaseError on general hardDelete failure
			await expect(Client.hardDelete(1, mockConnection)).rejects.toThrow(
				new DatabaseError('Failed to delete client.')
			);
		});
	});
});
