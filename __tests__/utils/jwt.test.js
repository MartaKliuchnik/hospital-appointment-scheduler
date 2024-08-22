const crypto = require('crypto');
const { createJWT, verifyJWT } = require('../../src/utils/jwt');

/**
 * Test suite for JWT Utility Functions.
 * Includes tests for createJWT and verifyJWT functions.
 */
describe('JWT Utility Functions', () => {
	const header = {
		alg: 'HS256',
		typ: 'JWT',
	};
	const payload = {
		clientId: 1,
		firstName: 'Alex',
		lastName: 'Smith',
		role: 'PATIENT',
	};
	const secret = 'JWT_SECRET';

	let token;

	beforeEach(() => {
		token = createJWT(header, payload, secret);
	});

	// Tests for the createJWT utility function
	describe('Creating a JSON Web Token', () => {
		it('should generate a valid JWT string', () => {
			// Verify that the token is a non-empty string
			expect(typeof token).toBe('string');
			// Check that the token matches the expected JWT format (three base64url-encoded parts separated by dots)
			expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
		});

		it('should encode the header correctly', () => {
			const [encodedHeader] = token.split('.');
			const decodedHeader = JSON.parse(
				Buffer.from(encodedHeader, 'base64').toString()
			);

			// Verify that the decoded header matches the expected header object
			expect(decodedHeader).toEqual(header);
		});

		it('should encode the payload correctly', () => {
			const [, encodedPayload] = token.split('.');
			const decodedPayload = JSON.parse(
				Buffer.from(encodedPayload, 'base64').toString()
			);

			// Verify that the decoded payload matches the expected payload object
			expect(decodedPayload).toEqual(payload);
		});

		it('should generate a correct signature', () => {
			const [, , signature] = token.split('.');
			const expectedSignature = crypto
				.createHmac('sha256', secret)
				.update(`${token.split('.')[0]}.${token.split('.')[1]}`)
				.digest('base64')
				.replace(/\+/g, '-')
				.replace(/\//g, '_')
				.replace(/=/g, '');

			// Verify that the generated signature matches the expected signature
			expect(signature).toBe(expectedSignature);
		});
	});

	// Tests for the verifyJWT utility function
	describe('Verifying a JSON Token', () => {
		it('should return the decoded payload for a valid token', () => {
			const decodedPayload = verifyJWT(token, secret);

			// Verify that a valid token returns the decoded payload
			expect(decodedPayload).toEqual(payload);
		});

		it('should return null for an invalid signature', () => {
			const invalidToken = `${token.split('.')[0]}.${
				token.split('.')[1]
			}.invalidsignature`;

			// Verify that an invalid signature returns null
			expect(verifyJWT(invalidToken, secret)).toBeNull();
		});

		it('should return null for a token with an incorrect secret', () => {
			const wrongSecret = 'wrongsecret';

			// Verify that the incorrect secret should return null
			expect(verifyJWT(token, wrongSecret)).toBeNull();
		});

		it('should handle tokens with no payload or header', () => {
			const invalidToken = '..';

			// Verify that tokens missing header or payload return null
			expect(verifyJWT(invalidToken, secret)).toBeNull();
		});

		it('should handle empty token strings', () => {
			// Verify that an empty token string returns null
			expect(verifyJWT('', secret)).toBeNull();
		});

		it('should handle null token values', () => {
			// Verify that a null token value returns null
			expect(verifyJWT(null, secret)).toBeNull();
		});

		it('should handle undefined token values', () => {
			// Verify that an undefined token value returns null
			expect(verifyJWT(undefined, secret)).toBeNull();
		});
	});
});
