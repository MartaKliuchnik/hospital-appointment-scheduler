const { Router } = require('express');
const appointmentsController = require('../controllers/appointments');
const authMiddleware = require('../middleware/auth');

const router = Router();

// Apply the authentication middleware to all routes defined in this router.
router.use(authMiddleware.checkAuth);

// Render a page with an appointment form. (route: /appointment)
router.get('/', appointmentsController.getAppointments);

// Create a new appointment (route: /appointment/create)
router.post('/create', appointmentsController.createAppointment);

module.exports = router;
