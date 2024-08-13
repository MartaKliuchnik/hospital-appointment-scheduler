const Role = require('../../src/enums/Role');
const Client = require('../../src/models/client');
const { DatabaseError } = require('../../src/utils/customErrors');
const { pool } = require('../../src/utils/database');

// - Mocked 'database' module to avoid real database queries during tests.
jest.mock('../../src/utils/database', () => ({
	pool: {
		execute: jest.fn(),
	},
}));

// Mocked 'auth' module to simulate password comparison without real authentication.
jest.mock('../../src/utils/auth', () => ({
	comparePassword: jest.fn(),
}));

/**
 * Test suite for Client Model implementation.
 * Includes methods for registering, validating email, and constructing Client instances.
 */
describe('Client Model', () => {
	let mockClientData;
	beforeEach(() => {
		mockClientData = {
			firstName: 'Carlos',
			lastName: 'Gonzalez',
			phoneNumber: '+1(456)555-0123',
			email: 'gonzalez@example.com',
			password: 'Gonzalez123',
			role: Role.PATIENT,
			clientId: 1,
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

	// Client constructor tests
	describe('Constructor', () => {
		it('should create a new Client instance with default values', () => {
			const client = new Client(
				'Carlos',
				'Gonzalez',
				'+1(456)555-0123',
				'gonzalez@example.com',
				'Gonzalez123'
			);

			// Verify that the properties of the client instance are correctly set
			expect(client.firstName).toBe('Carlos');
			expect(client.lastName).toBe('Gonzalez');
			expect(client.phoneNumber).toBe('+1(456)555-0123');
			expect(client.email).toBe('gonzalez@example.com');
			expect(client.password).toBe('Gonzalez123');
			expect(client.role).toBe(Role.PATIENT);
			expect(client.clientId).toBeNull();
			expect(client.deletedAt).toBeNull();
		});
	});

	// Client registration tests
	describe('Register', () => {
		it('should register a new client and return the new client ID', async () => {
			const mockInsertId = 1;
			pool.execute.mockResolvedValue([{ insertId: mockInsertId }]);

			// Define a sample client
			const client = new Client(
				'Carlos',
				'Gonzalez',
				'+1(456)555-0123',
				'gonzalez@example.com',
				'Gonzalez123'
			);
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

			const client = new Client(
				'Carlos',
				'Gonzalez',
				'gonzalez@example.com',
				'Gonzalez123',
				'+1(456)555-0123'
			);

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
});
