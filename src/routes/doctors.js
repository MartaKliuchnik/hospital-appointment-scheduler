const { Router } = require('express');
const doctortsController = require('../controllers/doctors');

const router = Router();

// GET /api/v1/doctors
// Retrieve all doctors
router.get('/', doctortsController.listDoctors);

// GET /api/v1/doctors/:doctorId
// Retrieve a specified doctor by id
router.get('/:doctorId', doctortsController.getDoctor);

// DELETE /api/v1/doctors/:doctorId
// Delete the specified doctor
router.delete('/:doctorId', doctortsController.deleteDoctor);

module.exports = router;
