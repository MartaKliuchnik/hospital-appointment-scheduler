const { Router } = require('express');
const appointmentsController = require('../controllers/appointments');
const authMiddleware = require('../middleware/auth');

const router = Router();

// Apply the authentication middleware to all routes defined in this router.
router.use(authMiddleware.checkAuth);

// Render a page with an appointment form. (route: /appointments)
router.get('/', appointmentsController.getAppointments);

// Create a new appointment (route: /appointments/create)
router.post('/create', appointmentsController.createAppointment);

// retrieve all appointments for the specified client (route: /appointments/client-appointments/:clientId)
router.get(
	'/client-appointments/:clientId',
	appointmentsController.getClientAppointments
);

module.exports = router;
