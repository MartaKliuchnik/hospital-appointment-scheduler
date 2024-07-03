const bcrypt = require('bcrypt');

const hashPassword = async (password) => {
	try {
		const hashedPassword = await bcrypt.hash(password, 10);
		return hashedPassword;
	} catch (error) {
		throw new Error('Error hashing password');
	}
};

const comparePassword = async (password, hashedPassword) => {
	try {
		const isMatch = await bcrypt.compare(password, hashedPassword);
		return isMatch;
	} catch {
		throw new Error('Error comparing password');
	}
};

module.exports = { hashPassword, comparePassword };
