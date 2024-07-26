/**
 * @enum {string}
 * @readonly
 * @description - Enum for user roles.
 */
const Role = Object.freeze({
	/** Unauthenticated user with limited access */
	ANONYMOUS: 'ANONYMOUS',
	/** User with full administrative privileges */
	ADMIN: 'ADMIN',
	/** Registered patient user */
	PATIENT: 'PATIENT',
});

module.exports = Role;
