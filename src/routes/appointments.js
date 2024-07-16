const { Router } = require('express');

const appointmentsController = require('../controllers/appointments');
const authMiddleware = require('../middleware/auth');

const router = Router();

router.use(authMiddleware.checkAuth);

router.get('/', appointmentsController.getAppointments);

module.exports = router;
