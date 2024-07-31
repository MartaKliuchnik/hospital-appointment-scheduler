const { Router } = require('express');
const clientsController = require('../controllers/admin');
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
	clientsController.updateUserRole
);

/**
 * @route DELETE /api/v1/clients/:clientId
 * @description Delete the specified user
 * @access Private
 */
router.delete(
	'/:clientId',
	checkPermission(Permission.DELETE_CLIENT),
	clientsController.deleteClient
);

/**
 * @route GET /api/v1/clients
 * @description Retrieve all clients
 * @access Private
 */
router.get(
	'/',
	checkPermission(Permission.READ_CLIENT),
	clientsController.listClients
);

module.exports = router;
