const { Router } = require('express');

const authController = require('../controllers/auth');

const router = Router();

router.get('/login', authController.getOAuth);
router.get('/google/callback', authController.getGoogleCallback);

module.exports = router;
