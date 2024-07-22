const { Router } = require('express');
const doctortsController = require('../controllers/doctors');
const authMiddleware = require('../middleware/auth');
const checkPermission = require('../middleware/permission');

const router = Router();

// Public routes (no authentication required)
// GET /api/v1/doctors - retrieve all doctors
router.get('/', checkPermission('read_doctor'), doctortsController.listDoctors);

// GET /api/v1/doctors/:doctorId - retrieve a specified doctor by id
router.get(
	'/:doctorId',
	checkPermission('read_doctor'),
	doctortsController.getDoctor
);

// Apply authentication middleware for protected routes
router.use(authMiddleware.checkAuth);

// Protected routes (authentication required)

// POST /api/v1/doctors - reate a new doctor
// router.post(
// 	'/',
// 	checkPermission('create_doctor'),
// 	doctortsController.createDoctor
// );

// DELETE /api/v1/doctors/:doctorId - delete the specified doctor
router.delete(
	'/:doctorId',
	checkPermission('delete_doctor'),
	doctortsController.deleteDoctor
);

// PUT /api/v1/doctors/:doctorId - update the specified doctor
router.put(
	'/:doctorId',
	checkPermission('update_doctor'),
	doctortsController.updateDoctor
);

module.exports = router;
