const {
	sendErrorResponse,
	sendSuccessResponse,
} = require('../../src/utils/responseHandlers');

/**
 * Test suite for Response Helpers utilities.
 * Includes tests for sendErrorResponse and sendSuccessResponse functions.
 */
describe('Response Helpers', () => {
	let mockRes;

	beforeEach(() => {
		mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
	});

	// Tests for the sendSuccessResponse utility function
	describe('Sending a success response', () => {
		it('should send a success response with the specified status code and message', () => {
			sendSuccessResponse(mockRes, 200, 'Success message');

			// Ensure the status method of mockRes is called with the correct status code (200).
			expect(mockRes.status).toHaveBeenCalledWith(200);
			// Ensure the json method of mockRes is called with the correct message in the response body.
			expect(mockRes.json).toHaveBeenCalledWith({
				message: 'Success message',
			});
		});

		it('should include data in the response when data is provided', () => {
			const data = { user: 'new_user' };
			sendSuccessResponse(mockRes, 201, 'Created data', data);

			// Ensure the status method of mockRes is called with the correct status code (201).
			expect(mockRes.status).toHaveBeenCalledWith(201);
			// Ensure the json method of mockRes is called with the correct message and data in the response body.
			expect(mockRes.json).toHaveBeenCalledWith({
				message: 'Created data',
				data: { user: 'new_user' },
			});
		});
	});

	// Tests for the sendErrorResponse utility function
	describe('Sending an error response', () => {
		it('should send an error response with the specified status code and message', () => {
			sendErrorResponse(mockRes, 400, 'Some ValidationError info');

			// Check that the status method was called with the correct status code (400).
			expect(mockRes.status).toHaveBeenCalledWith(400);
			// Check that the json method was called with the correct error message.
			expect(mockRes.json).toHaveBeenCalledWith({
				message: 'Some ValidationError info',
			});
		});

		it('should include errors in the response when data is provided', () => {
			const errors = { field: 'Invalid request' };
			sendErrorResponse(mockRes, 401, 'Some AuthenticationError info', errors);

			// Check that the status method was called with the correct status code (401).
			expect(mockRes.status).toHaveBeenCalledWith(401);
			// Check that the json method was called with the correct message and error data.
			expect(mockRes.json).toHaveBeenCalledWith({
				message: 'Some AuthenticationError info',
				errors: { field: 'Invalid request' },
			});
		});
	});
});
