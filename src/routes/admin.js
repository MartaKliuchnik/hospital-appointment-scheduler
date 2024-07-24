const { Router } = require('express');
const clietnsController = require('../controllers/admin');
const checkPermission = require('../middleware/permission');
const Permission = require('../enums/Permission');

const router = Router();

/**
 * @route PUT /api/v1/clients/:clientId/role
 * @description Update the role of a specified user
 * @access Private
 */
router.put(
	'/:clientId/role',
	checkPermission(Permission.UPDATE_USER_ROLE),
	clietnsController.updateUserRole
);

module.exports = router;
