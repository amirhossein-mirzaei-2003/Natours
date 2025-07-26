const express = require('express');
const fs = require('fs');
const toursController = require('../controllers/toursController');
const authController = require('./../controllers/authController');
const reviewController = require('./../controllers/reviewController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-5-cheap')
  .get(toursController.aliasTopTours, toursController.getAllTours);

router.route('/stats').get(toursController.getTourStats);

router.route('/monthly-plan/:year').get(toursController.getMonthlyPlan);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(toursController.getTourWithin);

router.route('/distances/:latlng/unit/:unit').get(toursController.getDistances);

router
  .route('/')
  .get(toursController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    toursController.createTour,
  );

router
  .route('/:id')
  .get(toursController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    toursController.uploadTourImages,
    toursController.resizeTourImages,
    toursController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    toursController.deleteTour,
  );

module.exports = router;
