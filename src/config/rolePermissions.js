const Role = require('../enums/Role');
const Permission = require('../enums/Permission');

class RolePermissions {
	/**
	 * @property {Map<string, Array<string>>} rolePermissions - The map of roles to their permissions.
	 */
	constructor() {
		this.rolePermissions = new Map();
		this.initializeRolePermissions();
	}

	/**
	 * Initializes the role permissions map with default values.
	 * @returns {void} - The method does not return a value.
	 */
	initializeRolePermissions() {
		this.rolePermissions.set(Role.ANONYMOUS, [Permission.READ_DOCTOR]);
		this.rolePermissions.set(Role.ADMIN, Object.values(Permission));
		this.rolePermissions.set(Role.PATIENT),
			[
				Permission.READ_DOCTOR,
				Permission.CREATE_APPOINTMENT,
				Permission.READ_APPOINTMENT,
				Permission.UPDATE_APPOINTMENT,
				Permission.DELETE_APPOINTMENT,
			];
	}

	/**
	 * Retrieves permissions for a specific role.
	 * @param {string} role - The role for which to find permissions.
	 * @returns {Array<string>} - An array of permissions for the role, or an empty array if not found.
	 */
	getRolePermissions(role) {
		return this.rolePermissions.get(role) || [];
	}

	/**
	 * Checks if a role has a specific permission.
	 * @param {string} role - The role to check.
	 * @param {string} requiredPermission - The permission to check for.
	 * @returns {boolean} - Returns true if the role has the permission, false otherwise.
	 */
	hasPermissions(role, requiredPermission) {
		const permissions = this.getRolePermissions(role);
		return permissions.includes(requiredPermission);
	}
}

module.exports = RolePermissions;
