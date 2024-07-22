const { Router } = require('express');

const authController = require('../controllers/auth');

const router = Router();

/**
 * @route GET /api/v1/auth/login
 * @description Get login page
 * @access Public
 */
router.get('/login', authController.getLogin);

/**
 * @route POST /api/v1/auth/login
 * @description Authenticate user
 * @access Public
 */
router.post('/login', authController.postLogin);

/**
 * @route GET /api/v1/auth/register
 * @description Get registration page
 * @access Public
 */
router.get('/register', authController.getRegister);

/**
 * @route POST /api/v1/auth/register
 * @description Register new user
 * @access Public
 */
router.post('/register', authController.postRegister);

module.exports = router;
