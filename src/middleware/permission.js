const Role = require('../enums/Role');
const RolePermissions = require('../config/rolePermissions');
const Client = require('../models/client');

const rolePermissions = new RolePermissions();

/**
 * Creates a middleware function to check if a client has the required permission.
 * @param {string} requiredPermission - The permission required for the route.
 * @param {boolean} allowUnauthenticated - Whether to allow unauthenticated access.
 * @returns {function} - Middleware function to check permission.
 */
const checkPermission = (requiredPermission, allowUnauthenticated = false) => {
	return async (req, res, next) => {
		try {
			// Get the client's ID from the authenticated request
			const clientId = req.client?.clientId;

			// If there's no clientId
			if (!clientId) {
				return handleUnauthenticatedAccess(
					allowUnauthenticated,
					requiredPermission,
					res,
					next
				);
			}

			// If we have a clientId
			const client = await Client.findById(clientId);
			if (!client) {
				return res.status(404).json({ error: 'Client not found.' });
			}

			// Get the latest client's role from the database, defaulting to ANONYMOUS if not set
			const clientRole = req.client.role || Role.ANONYMOUS;

			// Check if the role includes the required permission
			if (rolePermissions.hasPermissions(clientRole, requiredPermission)) {
				return next();
			}

			res.status(403).json({ error: 'Access denied.' });
		} catch (error) {
			console.error('Error checking permission:', error);
			return res
				.status(500)
				.json({ error: 'An error occurred while checking permissions.' });
		}
	};
};

/**
 * Handles unauthenticated access attempts.
 * @param {boolean} allowUnauthenticated - Whether to allow unauthenticated access.
 * @param {string} requiredPermission - The required permission.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function.
 * @returns {*} - The appropriate response or next() call.
 */
const handleUnauthenticatedAccess = (
	allowUnauthenticated,
	requiredPermission,
	res,
	next
) => {
	if (!allowUnauthenticated) {
		return res.status(401).json({ error: 'Authentication required.' });
	}

	if (rolePermissions.hasPermissions(Role.ANONYMOUS, requiredPermission)) {
		return next();
	}

	res.status(403).json({ error: 'Access denied.' });
};

module.exports = checkPermission;
