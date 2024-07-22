const roles = {
	anonymous: ['read_doctor'],
	admin: [
		'create_doctor',
		'read_doctor',
		'update_doctor',
		'delete_doctor',
		'read_appointment',
		'update_appointment',
		'delete_appointment',
	],
	patient: [
		'read_doctor',
		'create_appointment',
		'read_appointment',
		'update_appointment',
		'delete_appointment',
	],
};

module.exports = roles;
