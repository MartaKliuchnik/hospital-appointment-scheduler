const { Router } = require('express');
const doctortsController = require('../controllers/doctors');
const authMiddleware = require('../middleware/auth');
const checkPermission = require('../middleware/permission');
const Permission = require('../enums/Permission');

const router = Router();

/**
 * @route GET /api/v1/doctors
 * @description Retrieve all doctors
 * @access Public
 */
router.get(
	'/',
	checkPermission(Permission.READ_DOCTOR),
	doctortsController.listDoctors
);

/**
 * @route GET /api/v1/doctors/:doctorId
 * @description Retrieve a specified doctor by id
 * @access Public
 */
router.get(
	'/:doctorId',
	checkPermission(Permission.READ_DOCTOR),
	doctortsController.getDoctor
);

// Apply authentication middleware for protected routes
router.use(authMiddleware.checkAuth);

/**
 * @route POST /api/v1/doctors
 * @description Create a new doctor
 * @access Private
 */
// router.post(
// 	'/',
// 	checkPermission('create_doctor'),
// 	doctortsController.createDoctor
// );

/**
 * @route DELETE /api/v1/doctors/:doctorId
 * @description Delete the specified doctor
 * @access Private
 */
router.delete(
	'/:doctorId',
	checkPermission(Permission.DELETE_DOCTOR),
	doctortsController.deleteDoctor
);

/**
 * @route PUT /api/v1/doctors/:doctorId
 * @description Update the specified doctor
 * @access Private
 */
router.put(
	'/:doctorId',
	checkPermission(Permission.UPDATE_DOCTOR),
	doctortsController.updateDoctor
);

module.exports = router;
