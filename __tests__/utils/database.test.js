const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const { pool, createDatabase } = require('../../src/utils/database');

// Mock dependencies to isolate unit tests
jest.mock('fs'); // Mock fs methods
jest.mock('path'); // Mock path methods
jest.mock('mysql2', () => {
	return {
		createPool: jest.fn(() => {
			return {
				promise: jest.fn().mockReturnThis(), // Mock promise pool methods
				execute: jest.fn(),
				query: jest.fn(),
			};
		}),
	};
});

/**
 * Test suite for Database Utility Functions.
 * Includes tests for pool creation and database initialization functions.
 */
describe('Database Utility Functions', () => {
	// Clear any mocks after each test to avoid interference between tests.
	afterEach(() => {
		jest.clearAllMocks();
	});

	// Tests for pool creation functionality
	describe('Pool Creation', () => {
		it('should create a pool with correct configuration', () => {
			const defaultDbConfig = {
				host: 'localhost',
				user: 'root',
				password: undefined,
				database: 'hospitalAppointmentScheduler',
				timezone: 'Z',
			};

			// Check if mysql.createPool was called with the expected configuration object
			expect(mysql.createPool).toHaveBeenCalledWith(defaultDbConfig);
		});
	});

	// Tests for database initialization and schema setup
	describe('Creation database', () => {
		it("should create database if it doesn't exist", async () => {
			// Mocking fs and path methods
			fs.readFileSync.mockReturnValue('CREATE TABLE test (id INT);');
			path.join.mockReturnValue('../../01-schema.sql');

			pool.execute.mockResolvedValue([{}]); // Mocking execute to resolve successfully
			pool.query.mockResolvedValue([{}]); // Mocking query to resolve successfully

			await createDatabase();

			// Check if the methods were called with the correct arguments
			expect(pool.execute).toHaveBeenCalledWith(
				'CREATE DATABASE IF NOT EXISTS hospitalAppointmentScheduler'
			);
			expect(pool.query).toHaveBeenCalledWith(
				'USE hospitalAppointmentScheduler'
			);
			expect(pool.execute).toHaveBeenCalledWith('CREATE TABLE test (id INT)');
		});

		it('should throw an error if database creation fails', async () => {
			// Mocking fs and path methods
			fs.readFileSync.mockReturnValue('CREATE TABLE test (id INT);');
			path.join.mockReturnValue('../../01-schema.sql');

			pool.execute.mockRejectedValue(new Error('Database creation failed')); // Mocking pool methods to throw an error

			// Expect createDatabase to throw an error
			await expect(createDatabase()).rejects.toThrow(
				'Database creation failed'
			);
		});

		it('should throw an error if SQL execution fails', async () => {
			// Mocking fs and path methods
			fs.readFileSync.mockReturnValue('CREATE TABLE test (id INT);');
			path.join.mockReturnValue('../../01-schema.sql');

			pool.execute.mockResolvedValue([{}]); // Mocking execute to resolve successfully
			pool.query.mockResolvedValue([{}]); // Mocking query to resolve successfully

			// Simulate failure in executing SQL file
			fs.readFileSync.mockImplementationOnce(() => {
				throw new Error('Failed to read SQL file');
			});

			// Expect createDatabase to throw an error
			await expect(createDatabase()).rejects.toThrow(
				'Failed to execute SQL file'
			);
		});
	});
});
