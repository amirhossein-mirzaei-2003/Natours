const express = require('express');
const usersController = require('../controllers/usersController');
const authController = require('./../controllers/authController');

//===================== router

const router = express.Router();

router.post('/signup', authController.signUp);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//==================================== ONLY LOGED IN USERS
router.use(authController.protect);

router.patch('/updatePassword', authController.updatePassword);
router.patch(
  '/updateMe',
  usersController.uploadUserPhoto,
  usersController.resizeUserPhoto,
  usersController.updateMe,
);
router.delete('/deleteMe', usersController.deleteMe);
router.get('/me', usersController.getMe, usersController.getUser);

// =================================== ONLY ADMIN
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(usersController.getAllUsers)
  .post(usersController.createUser);

router
  .route('/:id')
  .get(usersController.getUser)
  .patch(usersController.updateUser)
  .delete(usersController.deleteUser);

module.exports = router;
