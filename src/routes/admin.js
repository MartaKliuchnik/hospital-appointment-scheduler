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

/**
 * @route DELETE /api/v1/clients/:clientId
 * @description Delete the specified user
 * @access Private
 */
router.delete(
	'/:clientId',
	checkPermission(Permission.DELETE_CLIENT),
	clietnsController.deleteClient
);

module.exports = router;
