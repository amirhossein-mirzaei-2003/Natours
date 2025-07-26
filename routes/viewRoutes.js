const express = require('express');
const viewController = require('./../controllers/viewController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.get('/me', authController.protect, viewController.getAccount);
router.post('/updateMe', authController.protect, viewController.updateUserData);

// check there is a loged in user
router.use(authController.isLogedIn);

// routers
router.get('/', viewController.getOverview);
router.get('/tour/:slug', viewController.getTour);
router.get('/login', viewController.getLoginForm);

module.exports = router;
