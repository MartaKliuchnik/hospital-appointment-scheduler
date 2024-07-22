const Role = require('../enums/Role');
const RolePermissions = require('../config/rolePermissions');

const rolePermissions = new RolePermissions();

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
		// Get the client's role, defaulting to ANONYMOUS if not set
		const clientRole = req.client?.role || Role.ANONYMOUS;

		// Check if the role includes the required permission
		if (rolePermissions.hasPermissions(clientRole, requiredPermission)) {
			next();
		} else {
			res.status(403).json({ error: 'Access denied' });
		}
	};
};

module.exports = checkPermission;
