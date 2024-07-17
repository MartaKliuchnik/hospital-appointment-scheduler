const { Router } = require('express');
const appointmentsController = require('../controllers/appointments');
const authMiddleware = require('../middleware/auth');

const router = Router();

// Apply the authentication middleware to all routes defined in this router.
router.use(authMiddleware.checkAuth);

// GET /api/v1/appointments
// Retrieve all appointments
router.get('/', appointmentsController.listAppointments);

// POST /api/v1/appointments
// Create a new appointment
router.post('/', appointmentsController.createAppointment);

// GET /api/v1/appointments/clients/:clientId
// Retrieve all appointments for the specified client
router.get('/clients/:clientId', appointmentsController.getClientAppointments);

// DELETE /api/v1/appointments/:appointmentId
// Delete the specified appointment
router.delete('/:appointmentId', appointmentsController.deleteAppointment);

// PUT /api/v1/appointments/:appointmentId
// Update the specified appointment
router.put('/:appointmentId', appointmentsController.updateAppointment);

module.exports = router;
