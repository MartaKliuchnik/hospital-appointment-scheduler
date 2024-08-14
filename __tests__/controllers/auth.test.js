const { postLogin, postRegister } = require('../../src/controllers/auth');
const Client = require('../../src/models/client');
const responseHandlers = require('../../src/utils/responseHandlers');
const {
	validateLoginInput,
	validateRegistrationInput,
} = require('../../src/utils/validations');
const {
	ValidationError,
	AuthenticationError,
	DatabaseError,
	ConflictError,
} = require('../../src/utils/customErrors');
const Role = require('../../src/enums/Role');
const { hashPassword } = require('../../src/utils/auth');

// Mock dependencies to isolate unit tests
jest.mock('../../src/models/client'); // Avoids real database operations
jest.mock('../../src/utils/responseHandlers'); // Controls response handling
jest.mock('../../src/utils/validations'); // Simulates validation outcomes
jest.mock('../../src/utils/auth'); // Avoids real password hashing

/**
 * Test suite for Auth controllers.
 * Includes tests for login and registration requests.
 */
describe('Auth Controller', () => {
	let req, res, next;
	beforeEach(() => {
		req = { body: {} };
		res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
		next = jest.fn();
		responseHandlers.sendSuccessResponse.mockClear();
	});

	// Clear any mocks after each test to avoid interference between tests.
	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('Handle login requests (postLogin)', () => {
		const mockClient = {
			verifyPassword: jest.fn(),
			createAuthToken: jest.fn(),
			toSafeObject: jest.fn(),
		};

		it('should successfully log in a user with correct credentials', async () => {
			req.body = {
				email: 'gonzalez@example.com',
				password: 'Gonzalez123',
			};
			mockClient.verifyPassword.mockResolvedValue(true);
			mockClient.createAuthToken.mockReturnValue('mockToken');
			mockClient.toSafeObject.mockReturnValue({
				id: 1,
				email: 'gonzalez@example.com',
			});

			Client.findByEmail.mockResolvedValue(mockClient);

			await postLogin(req, res, next);

			// Verify that the login input validation, user authentication, and success response were handled correctly.
			expect(validateLoginInput).toHaveBeenCalledWith(
				'gonzalez@example.com',
				'Gonzalez123'
			);
			expect(mockClient.verifyPassword).toHaveBeenCalledWith('Gonzalez123');
			expect(Client.findByEmail).toHaveBeenCalledWith('gonzalez@example.com');
			expect(mockClient.createAuthToken).toHaveBeenCalledWith();
			expect(responseHandlers.sendSuccessResponse).toHaveBeenCalledWith(
				res,
				200,
				'User logged successfully.',
				{
					token: 'mockToken',
					client: { id: 1, email: 'gonzalez@example.com' },
				}
			);
			expect(next).not.toHaveBeenCalled();
		});

		it('should handle invalid login input', async () => {
			req.body = { email: '', password: '' };
			validateLoginInput.mockImplementation(() => {
				throw new ValidationError('Email and password are required.');
			});

			await postLogin(req, res, next);

			// Ensure next was called with a ValidationError.
			expect(next).toHaveBeenCalledWith(
				new ValidationError('Email and password are required.')
			);
			// Ensure sendSuccessResponse was not called, indicating failure.
			expect(responseHandlers.sendSuccessResponse).not.toHaveBeenCalled();
		});

		it('should handle user not found', async () => {
			req.body = {
				email: 'gonzalez@example.com',
				password: 'Gonzalez123',
			};
			Client.findByEmail.mockReturnValue(null);
			validateLoginInput.mockImplementation(() => {});

			await postLogin(req, res, next);

			// Ensure next was called with an AuthenticationError.
			expect(next).toHaveBeenCalledWith(
				new AuthenticationError('User does not exist.')
			);
			// Ensure sendSuccessResponse was not called, indicating failure.
			expect(responseHandlers.sendSuccessResponse).not.toHaveBeenCalled();
		});

		it('should handle incorrect password', async () => {
			req.body = {
				email: 'gonzalez@example.com',
				password: 'Gonzalez123',
			};
			mockClient.verifyPassword.mockReturnValue(false);
			Client.findByEmail.mockResolvedValue(mockClient);
			validateLoginInput.mockImplementation(() => {});

			await postLogin(req, res, next);

			// Ensure next was called with an AuthenticationError.
			expect(next).toHaveBeenCalledWith(
				new AuthenticationError('Incorrect email or password.')
			);
			// Ensure sendSuccessResponse was not called, indicating failure.
			expect(responseHandlers.sendSuccessResponse).not.toHaveBeenCalled();
		});

		it('should handle unexpected errors', async () => {
			req.body = {
				email: 'gonzalez@example.com',
				password: 'Gonzalez123',
			};
			Client.findByEmail.mockRejectedValue(new Error('Unexpected error'));
			validateLoginInput.mockImplementation(() => {});

			await postLogin(req, res, next);

			// Ensure next was called with a DatabaseError.
			expect(next).toHaveBeenCalledWith(
				new DatabaseError(
					'An unexpected error occurred during login.',
					new Error('Unexpected error')
				)
			);
			// Ensure sendSuccessResponse was not called, indicating failure.
			expect(responseHandlers.sendSuccessResponse).not.toHaveBeenCalled();
		});
	});

	describe('Handle registration requests (postRegister)', () => {
		const mockRegistrationData = {
			firstName: 'Carlos',
			lastName: 'Gonzalez',
			email: 'gonzalez@example.com',
			password: 'Gonzalez123',
			phoneNumber: '+1(456)555-0123',
			role: Role.PATIENT,
		};

		beforeEach(() => {
			validateRegistrationInput.mockReset();
			hashPassword.mockReset();
			Client.prototype.register.mockReset();
		});

		const setupValidRegistration = () => {
			validateRegistrationInput.mockResolvedValue();
			hashPassword.mockResolvedValue('hashedPassword');
			Client.prototype.register.mockResolvedValue(1);
		};

		it('should successfully register a new client with valid input', async () => {
			req.body = mockRegistrationData;
			setupValidRegistration();

			await postRegister(req, res, next);

			// Check that the validation, registration, and response methods were called correctly.
			expect(validateRegistrationInput).toHaveBeenCalledWith(
				'Carlos',
				'Gonzalez',
				'+1(456)555-0123',
				'gonzalez@example.com',
				'Gonzalez123'
			);
			expect(Client.prototype.register).toHaveBeenCalledWith();
			expect(responseHandlers.sendSuccessResponse).toHaveBeenCalledWith(
				res,
				200,
				'User registered successfully',
				{ clientId: 1 }
			);
			expect(next).not.toHaveBeenCalled();
		});

		it('should handle invalid registration input', async () => {
			req.body = {
				firstName: '',
				lastName: '',
				phoneNumber: '',
				email: '',
				password: '',
			};
			validateRegistrationInput.mockImplementation(() => {
				throw new ValidationError('Invalid registration data.');
			});

			await postRegister(req, res, next);
			// Ensure next was called with a ValidationError.
			expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
			// Ensure sendSuccessResponse was not called, indicating failure.
			expect(responseHandlers.sendSuccessResponse).not.toHaveBeenCalled();
		});

		it('should handle registration conflict if email already exists', async () => {
			req.body = mockRegistrationData;
			setupValidRegistration();
			Client.prototype.register.mockRejectedValue(
				new ConflictError('Email already exists.')
			);

			await postRegister(req, res, next);
			// Ensure next was called with a ConflictError.
			expect(next).toHaveBeenCalledWith(
				new ConflictError('Email already exists.')
			);
			// Ensure sendSuccessResponse was not called, indicating failure.
			expect(responseHandlers.sendSuccessResponse).not.toHaveBeenCalled();
		});

		it('should handle unexpected errors', async () => {
			req.body = mockRegistrationData;
			setupValidRegistration();
			Client.prototype.register.mockRejectedValue(
				new Error('Unexpected error')
			);

			await postRegister(req, res, next);

			// Ensure next was called with a DatabaseError.
			expect(next).toHaveBeenCalledWith(
				new DatabaseError(
					'An unexpected error occurred during registration.',
					new Error('Unexpected error')
				)
			);
			// Ensure sendSuccessResponse was not called, indicating failure.
			expect(responseHandlers.sendSuccessResponse).not.toHaveBeenCalled();
		});
	});
});
