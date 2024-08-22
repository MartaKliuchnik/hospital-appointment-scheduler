const crypto = require('crypto');

/**
 * Replace special symbols in the string (“+” by “-” (minus), “/” by “_” (underline), "=" by '')
 * @param {string} str - The input string.
 * @returns {string} - The cleaned base64 string of URL special characters.
 */
const replaceSpecialChars = (str) =>
	str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

/**
 * Convert a string to Base64 with replacing special symbols.
 * @param {string} str - The input string.
 * @returns {string} - The encoded Base64URL.
 */
const base64urlEncode = (string) => {
	const base64String = Buffer.from(string).toString('base64');
	return replaceSpecialChars(base64String);
};

/**
 * Create a token’s header
 * @param {Object} header - The input header object.
 * @returns {string} - The encoded Base64 header.
 */
const encodeHeader = (header) => base64urlEncode(JSON.stringify(header));

/**
 * Create a token’s payload
 * @param {Object} payload -  The input payload object.
 * @returns {string} - The encoded Base64 payload.
 */
const encodePayload = (payload) => base64urlEncode(JSON.stringify(payload));

/**
 * Generate the signature
 * @param {string} encodedHeader - The encoded Base64 header.
 * @param {string} encodedPayload - The encoded Base64 payload.
 * @param {string} secret - The secret to sign the token.
 * @returns {string} - The generated signature.
 */
function createSignature(encodedHeader, encodedPayload, secret) {
	let signature = crypto
		.createHmac('sha256', secret) // create a HMAC(hash based message authentication code) using sha256 hashing alg
		.update(`${encodedHeader}.${encodedPayload}`) // use the update method to hash a string
		.digest('base64'); // converted signature to base64

	// Return the base64 signature with URL-safe characters
	return replaceSpecialChars(signature);
}

/**
 * Create a JSON Web Token by combining the results of the header, payload, and signature.
 * @param {Object} header - The token's header object.
 * @param {Object} payload - The token's payload object.
 * @param {string} secret - The secret to sign the token.
 * @returns {string} - The generated JSON Web Token.
 */
function createJWT(header, payload, secret) {
	const encodedHeader = encodeHeader(header);
	const encodedPayload = encodePayload(payload);
	const signature = createSignature(encodedHeader, encodedPayload, secret);

	return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify a JSON Token.
 * @param {string} token - The JWT to verify.
 * @param {string} secret - The secret to verify the token.
 * @returns {Object|null} -  The decoded payload if the token is valid, otherwise null.
 */
function verifyJWT(token, secret) {
	if (!token) return null;

	const [encodedHeader, encodedPayload, signature] = token.split('.');
	if (!encodedHeader || !encodedPayload || !signature) return null;

	const data = `${encodedHeader}.${encodedPayload}`;
	const expectedSignature = replaceSpecialChars(
		crypto.createHmac('sha256', secret).update(data).digest('base64')
	);
	if (signature !== expectedSignature) return null;

	return JSON.parse(Buffer.from(encodedPayload, 'base64').toString());
}

module.exports = { createJWT, verifyJWT };
