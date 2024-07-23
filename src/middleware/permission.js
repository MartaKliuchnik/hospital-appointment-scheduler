const Role = require('../enums/Role');
const RolePermissions = require('../config/rolePermissions');
const Client = require('../models/client');

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
	return async (req, res, next) => {
		try {
			// Get the client's ID from the authenticated request
			const clientId = req.client?.clientId;
			if (!clientId) {
				return res.status(401).json({ error: 'Authentication failed.' });
			}

			// Fetch the latest client information from the database
			const client = await Client.findById(clientId);
			if (!client) {
				return res.status(404).json({ error: 'Client not found.' });
			}

			// Get the latest client's role from the database, defaulting to ANONYMOUS if not set
			const clientRole = client.role || Role.ANONYMOUS;

			// Check if the role includes the required permission
			if (rolePermissions.hasPermissions(clientRole, requiredPermission)) {
				next();
			} else {
				res.status(403).json({ error: 'Access denied.' });
			}
		} catch (error) {
			console.error('Error checking permission:', error);
			res
				.status(500)
				.json({ error: 'An error occurred while checking permissions.' });
		}
	};
};

module.exports = checkPermission;
