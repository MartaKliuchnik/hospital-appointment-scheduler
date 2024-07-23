const { Router } = require('express');
const Permission = require('../enums/Permission');
const checkPermission = require('../middleware/permission');
const schedulesController = require('../controllers/schedules');

const router = Router();

/**
 * @route GET /api/v1/schedules/:scheduleId
 * @description Retrieve Doctor's Schedule
 * @access Public
 */
router.get(
	'/:scheduleId',
	// checkPermission(Permission.READ_SCHEDULE),
	schedulesController.getSchedule
);

/**
 * @route GET /api/v1/schedules/doctor-schedule/:doctorId
 * @description Retrieve Doctor's Schedules
 * @access Public
 */
router.get(
	'/doctor-schedule/:doctorId',
	// checkPermission(Permission.READ_SCHEDULE),
	schedulesController.getDoctorSchedule
);

// Apply the authentication middleware to all routes defined below this line.
// router.use(authMiddleware.checkAuth);

/**
 * @route POST /api/v1/schedules/doctor-schedule
 * @description Create a new schedule
 * @access Private
 */
router.post(
	'/doctor-schedule',
	// checkPermission(Permission.CREATE_SCHEDULE),
	schedulesController.createSchedule
);

/**
 * @route DELETE /api/v1/schedules/:scheduleId
 * @description Delete the specified schedule
 * @access Private
 */
router.delete(
	'/:scheduleId',
	// checkPermission(Permission.DELETE_SCHEDULE),
	schedulesController.deleteSchedule
);

/**
 * @route PUT /api/v1/schedules/:scheduleId
 * @description Update the specified schedule
 * @access Private
 */
router.put(
	'/:scheduleId',
	// checkPermission(Permission.UPDATE_APPOINTMENT),
	schedulesController.updateSchedule
);

module.exports = router;
