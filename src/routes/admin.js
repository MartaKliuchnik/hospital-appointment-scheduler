const { Router } = require('express');
const clientsController = require('../controllers/admin');
const checkPermission = require('../middleware/permission');
const Permission = require('../enums/Permission');
const { requireParam } = require('../middleware/admin');

const router = Router();

/**
 * @route GET /api/v1/clients/email/:email
 * @description Retrieve a specified client by email
 * @access Private
 */
router.get(
	'/email/:email?',
	checkPermission(Permission.READ_CLIENT),
	requireParam('email', 'Email address is required.'),
	clientsController.getClientByEmail
);

/**
 * @route GET /api/v1/clients/phone/:phoneNumber
 * @description Retrieve a specified client by phone number
 * @access Private
 */
router.get(
	'/phone/:phoneNumber?',
	checkPermission(Permission.READ_CLIENT),
	requireParam('phone', 'Phone number is required.'),
	clientsController.getClientByPhoneNumber
);

/**
 * @route GET /api/v1/clients/:clientId
 * @description Retrieve a specified client by id
 * @access Private
 */
router.get(
	'/:clientId?',
	checkPermission(Permission.READ_CLIENT),
	requireParam('clientId', 'Client ID is required.'),
	clientsController.getClientById
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
 * @route DELETE /api/v1/clients/:clientId
 * @description Delete the specified user
 * @access Private
 */
router.delete(
	'/:clientId?',
	checkPermission(Permission.DELETE_CLIENT),
	requireParam('clientId', 'Client ID is required.'),
	clientsController.deleteClient
);

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

module.exports = router;
