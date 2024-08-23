const bcrypt = require('bcrypt');
const { DatabaseError } = require('../../src/utils/customErrors');
const { hashPassword, comparePassword } = require('../../src/utils/auth');

// Mock dependencies to isolate unit tests
jest.mock('bcrypt');

/**
 * Test suite for password hashing and comparison utilities.
 * Includes tests for hashPassword and comparePassword functions.
 */
describe('Password Utility Functions', () => {
	const password = 'userPassword';
	const hashedPassword = 'hashedUserPassword';

	// Clear any mocks after each test to avoid interference between tests.
	afterEach(() => {
		jest.clearAllMocks();
	});

	// Tests for creating a hashed password using the bcrypt library
	describe('Creation a hashed password', () => {
		it('should successfully hash a password', async () => {
			bcrypt.hash.mockResolvedValue(hashedPassword); // Mock bcrypt to return a hashed password

			const result = await hashPassword(password);

			// Check that bcrypt.hash was called correctly
			expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
			// Ensure that the result is the hashed password
			expect(result).toBe(hashedPassword);
		});

		it('should throw DatabaseError if bcrypt.hash fails', async () => {
			const error = new Error('Hashing failed');
			bcrypt.hash.mockRejectedValue(error); // Mock bcrypt to throw an error

			// Expect hashPassword to throw a DatabaseError
			await expect(hashPassword(password)).rejects.toThrow(DatabaseError);
			// Expect the error message to match the custom error
			await expect(hashPassword(password)).rejects.toThrow(
				'Error hashing password'
			);
		});
	});

	// Tests for comparing a plain-text password with a hashed password using bcrypt
	describe('Comparing a plain-text password with a hashed password', () => {
		it('should return true for matching passwords', async () => {
			bcrypt.compare.mockResolvedValue(true); // Mock bcrypt to simulate a matching password comparison

			const result = await comparePassword(password, hashedPassword);

			// Check that bcrypt.compare was called with the correct arguments
			expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
			// Verify that the result is true
			expect(result).toBe(true);
		});

		it('should return false for non-matching passwords', async () => {
			bcrypt.compare.mockResolvedValue(false); // Mock bcrypt to simulate a non-matching password comparison

			const result = await comparePassword(password, 'nonMatchHashedPassword');

			// Check that bcrypt.compare was called with the correct arguments
			expect(bcrypt.compare).toHaveBeenCalledWith(
				password,
				'nonMatchHashedPassword'
			);
			// Verify that the result is false
			expect(result).toBe(false);
		});

		it('should throw DatabaseError if bcrypt.compare fails', async () => {
			const error = new Error('Comparing failed');
			bcrypt.compare.mockRejectedValue(error); // Mock bcrypt to throw an error

			// Expect comparePassword to throw a DatabaseError
			await expect(comparePassword(password.hashedPassword)).rejects.toThrow(
				DatabaseError
			);
			// Expect the error message to match the custom error
			await expect(comparePassword(password, hashedPassword)).rejects.toThrow(
				'Error comparing password'
			);
		});
	});
});
