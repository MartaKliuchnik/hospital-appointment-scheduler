const { Router } = require('express');

const appointmentsController = require('../controllers/appointments');

const router = Router();

// router.use(appointmentsController.checkUser);

router.get('/', appointmentsController.getAppointments);

module.exports = router;
