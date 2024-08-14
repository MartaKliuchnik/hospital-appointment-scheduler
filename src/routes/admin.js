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

/**
 * @route GET /api/v1/clients/:clientId
 * @description Retrieve a specified client by id
 * @access Private
 */
router.get(
	'/:clientId',
	checkPermission(Permission.READ_CLIENT),
	clientsController.getClientById
);

/**
 * @route GET /api/v1/clients/email/:email
 * @description Retrieve a specified client by email
 * @access Private
 */
router.get(
	'/email/:email',
	checkPermission(Permission.READ_CLIENT),
	clientsController.getClientByEmail
);

/**
 * @route GET /api/v1/clients/phone/:phoneNumber
 * @description Retrieve a specified client by phone number
 * @access Private
 */
router.get(
	'/phone/:phoneNumber',
	checkPermission(Permission.READ_CLIENT),
	clientsController.getClientByPhoneNumber
);

module.exports = router;
