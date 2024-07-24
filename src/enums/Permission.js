/**
 * @enum {string}
 * @readonly
 * @description - Enum for Permission types.
 */
const Permission = Object.freeze({
	/** Permission to read doctor information */
	READ_DOCTOR: 'READ_DOCTOR',
	/** Permission to create new doctor entries */
	CREATE_DOCTOR: 'CREATE_DOCTOR',
	/** Permission to update existing doctor information */
	UPDATE_DOCTOR: 'UPDATE_DOCTOR',
	/** Permission to delete doctor entries */
	DELETE_DOCTOR: 'DELETE_DOCTOR',
	/** Permission to read appointment information */
	READ_APPOINTMENT: 'READ_APPOINTMENT',
	/** Permission to create new appointments */
	CREATE_APPOINTMENT: 'CREATE_APPOINTMENT',
	/** Permission to update existing appointments */
	UPDATE_APPOINTMENT: 'UPDATE_APPOINTMENT',
	/** Permission to delete appointments */
	DELETE_APPOINTMENT: 'DELETE_APPOINTMENT',
	/** Permission to update the role of a specified user */
	UPDATE_USER_ROLE: 'UPDATE_USER_ROLE',
	/** Permission to read doctor schedule */
	READ_SCHEDULE: 'READ_SCHEDULE',
	/** Permission to create new schedule */
	CREATE_SCHEDULE: 'CREATE_SCHEDULE',
	/** Permission to update the specified schedule */
	UPDATE_SCHEDULE: 'UPDATE_SCHEDULE',
	/** Permission to delete specified schedule */
	DELETE_SCHEDULE: 'DELETE_SCHEDULE',
});

module.exports = Permission;
