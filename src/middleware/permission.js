const Role = require('../enums/Role');
const RolePermissions = require('../config/rolePermissions');
const { validateClientId } = require('../utils/validations');
const { sendErrorResponse } = require('../utils/responseHandlers');

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

			validateClientId(clientId);

			// Get the latest client's role from the database, defaulting to ANONYMOUS if not set
			const clientRole = req.client.role || Role.ANONYMOUS;
			// Check if the role includes the required permission
			if (rolePermissions.hasPermissions(clientRole, requiredPermission)) {
				return next();
			}

			return sendErrorResponse(
				res,
				403,
				'Access denied. Admin privileges required.'
			);
		} catch (error) {
			console.error('Error checking permission:', error);
			return sendErrorResponse(
				res,
				500,
				'An error occurred while checking permissions.'
			);
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
		return sendErrorResponse(res, 401, 'Authentication required.');
	}

	if (rolePermissions.hasPermissions(Role.ANONYMOUS, requiredPermission)) {
		return next();
	}

	return sendErrorResponse(res, 403, 'Access denied.');
};

module.exports = checkPermission;
