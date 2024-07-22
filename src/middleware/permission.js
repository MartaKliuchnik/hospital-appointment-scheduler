const roles = require('../config/roles');

/**
 * Creates a middleware function to check if a client has the required permission.
 * @param {string} requiredPermission - The permission required for the route.
 * @returns {function} Middleware function to check permission.
 */
const checkPermission = (requiredPermission) => {
	/**
	 * Middleware function that checks if the client has the required permission.
	 * @param {object} req - The request object.
	 * @param {object} res - The response object.
	 * @param {function} next - The next middleware function in the stack.
	 * @returns {void} - This middleware does not return a value.
	 */
	return (req, res, next) => {
		// Default to 'anonymous' if no client or role is set
		let clientRole = 'anonymous';

		// Check if the role exists
		if (!roles[clientRole]) {
			console.error(`Unknown role: ${clientRole}`);
			return res.status(403).json({ error: 'Access denied' });
		}

		// Check if the role includes the required permission
		if (roles[clientRole].includes(requiredPermission)) {
			next();
		} else {
			res.status(403).json({ error: 'Access denied' });
		}
	};
};

module.exports = checkPermission;
