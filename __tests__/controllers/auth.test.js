const { postLogin } = require('../../src/controllers/auth');
const Client = require('../../src/models/client');
const responseHandlers = require('../../src/utils/responseHandlers');
const { validateLoginInput } = require('../../src/utils/validations');
const {
	ValidationError,
	AuthenticationError,
	DatabaseError,
} = require('../../src/utils/customErrors');

// Mock the Client model to avoid actual database calls during tests.
jest.mock('../../src/models/client');
// Mock the response handlers to test how they are called.
jest.mock('../../src/utils/responseHandlers');
// Mock the validation utility to control its behavior in tests.
jest.mock('../../src/utils/validations');

/**
 * Test suite for Auth controllers.
 * This suite includes tests for handling login and register requests.
 */
describe('Auth Controller', () => {
	let req, res, next;
	beforeEach(() => {
		jest.clearAllMocks();
		req = { body: {} };
		res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
		next = jest.fn();
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

			// Ensure validateLoginInput was called with correct parameters.
			expect(validateLoginInput).toHaveBeenCalledWith(
				'gonzalez@example.com',
				'Gonzalez123'
			);
			// Ensure verifyPassword was called with the provided password.
			expect(mockClient.verifyPassword).toHaveBeenCalledWith('Gonzalez123');
			// Ensure findByEmail was called with the provided email.
			expect(Client.findByEmail).toHaveBeenCalledWith('gonzalez@example.com');
			// Ensure createAuthToken was called to generate a token.
			expect(mockClient.createAuthToken).toHaveBeenCalledWith();
			// Ensure sendSuccessResponse was called to return a successful login response.
			expect(responseHandlers.sendSuccessResponse).toHaveBeenCalledWith(
				res,
				200,
				'User logged successfully.',
				{
					token: 'mockToken',
					client: { id: 1, email: 'gonzalez@example.com' },
				}
			);
			// Ensure next was not called, indicating no errors occurred.
			expect(next).not.toHaveBeenCalled();
		});

		it('should handle invalid email/password input', async () => {
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
});
