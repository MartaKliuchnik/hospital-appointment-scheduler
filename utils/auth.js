const bcrypt = require('bcrypt');

/**
 * Create hashed password by using the bcrypt library.
 * @param {string} password - The plain-text password to be hashed.
 * @returns {Promise<string>} - A promise that resolves to the hashed password.
 * @throws {Error} - Throws an error if hashing fails.
 */
const hashPassword = async (password) => {
	try {
		const hashedPassword = await bcrypt.hash(password, 10);
		return hashedPassword;
	} catch (error) {
		throw new Error('Error hashing password');
	}
};

/**
 * Compares a plain-text password with a hashed password using bcrypt.
 * @param {*} password - The plain-text password to compare.
 * @param {*} hashedPassword - The hashed password to compare against.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating if the passwords match.
 * @throws {Error} - Throws an error if comparison fails.
 */
const comparePassword = async (password, hashedPassword) => {
	try {
		const isMatch = await bcrypt.compare(password, hashedPassword);
		return isMatch;
	} catch {
		throw new Error('Error comparing password');
	}
};

module.exports = { hashPassword, comparePassword };
