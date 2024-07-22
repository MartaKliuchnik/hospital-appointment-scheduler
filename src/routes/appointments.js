const { Router } = require('express');
const appointmentsController = require('../controllers/appointments');
const authMiddleware = require('../middleware/auth');
const checkPermission = require('../middleware/permission');

const router = Router();

// Apply the authentication middleware to all routes defined in this router.
router.use(authMiddleware.checkAuth);

// GET /api/v1/appointments
// Retrieve all appointments
router.get(
	'/',
	checkPermission('read_appointment'),
	appointmentsController.listAppointments
);

// POST /api/v1/appointments
// Create a new appointment
router.post(
	'/',
	checkPermission('create_appointment'),
	appointmentsController.createAppointment
);

// GET /api/v1/appointments/clients/:clientId
// Retrieve all appointments for the specified client
router.get(
	'/clients/:clientId',
	checkPermission('read_appointment'),
	appointmentsController.getClientAppointments
);

// DELETE /api/v1/appointments/:appointmentId
// Delete the specified appointment
router.delete(
	'/:appointmentId',
	checkPermission('delete_appointment'),
	appointmentsController.deleteAppointment
);

// PUT /api/v1/appointments/:appointmentId
// Update the specified appointment
router.put(
	'/:appointmentId',
	checkPermission('update_appointment'),
	appointmentsController.updateAppointment
);

module.exports = router;
