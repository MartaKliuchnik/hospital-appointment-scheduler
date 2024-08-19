const { Router } = require('express');
const appointmentsController = require('../controllers/appointments');
const checkPermission = require('../middleware/permission');
const Permission = require('../enums/Permission');
const { requireParam } = require('../middleware/admin');

const router = Router();

/**
 * @route POST /api/v1/appointments
 * @description Create a new appointment
 * @access Private
 */
router.post(
	'/',
	checkPermission(Permission.CREATE_APPOINTMENT),
	appointmentsController.createAppointment
);

/**
 * @route GET /api/v1/appointments/clients/:clientId
 * @description Retrieve all appointments for the specified client
 * @access Private
 */
router.get(
	'/clients/:clientId?',
	checkPermission(Permission.READ_APPOINTMENT),
	requireParam('clientId', 'Client ID is required.'),
	appointmentsController.getClientAppointments
);

/**
 * @route DELETE /api/v1/appointments/:appointmentId
 * @description Delete the specified appointment
 * @access Private
*/
router.delete(
	'/:appointmentId?',
	checkPermission(Permission.DELETE_APPOINTMENT),
	requireParam('appointmentId', 'Appointment ID is required.'),
	appointmentsController.deleteAppointment
);

/**
 * @route PUT /api/v1/appointments/:appointmentId
 * @description Update the specified appointment
 * @access Private
*/
router.put(
	'/:appointmentId?',
	checkPermission(Permission.UPDATE_APPOINTMENT),
	requireParam('appointmentId', 'Appointment ID is required.'),
	appointmentsController.updateAppointment
);

module.exports = router;
