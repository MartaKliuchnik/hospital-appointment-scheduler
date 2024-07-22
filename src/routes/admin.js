const { Router } = require('express');

const router = Router();

const clietnsController = require('../controllers/admin');
const authMiddleware = require('../middleware/auth');
const checkPermission = require('../middleware/permission');
const Permission = require('../enums/Permission');

// Apply authentication middleware for protected route
router.use(authMiddleware.checkAuth);

/**
 * @route PUT /api/v1/clients/:clientId/role
 * @description Update the role of a specified user
 * @access Private
 */
router.put(
	'/:clientId/role',
	// checkPermission(Permission.UPDATE_USER_ROLE),
	clietnsController.updateUserRole
);

module.exports = router;
