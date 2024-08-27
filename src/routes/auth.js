const { Router } = require('express');

const authController = require('../controllers/auth');

const router = Router();

/**
 * @route POST /api/v1/auth/login
 * @description Authenticate user
 * @access Public
 */
router.post('/login', authController.postLogin);

/**
 * @route POST /api/v1/auth/register
 * @description Register new user
 * @access Public
 */
router.post('/register', authController.postRegister);

/**
 * @route DELETE /api/v1/auth/logout
 * @description Log out the user and invalidate the session/token
 * @access Private
 */
router.delete('/logout', authController.logout);

module.exports = router;
