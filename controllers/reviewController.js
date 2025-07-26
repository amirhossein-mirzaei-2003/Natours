const catchAsync = require('../utils/catchAsync');
const Review = require('./../models/reviewModel');
const handlerFactory = require('./handlerFactory');

exports.getTourId = (req, res, next) => {
  console.log(req.params.tourId);
  if (req.params.tourId) req.filters = { tour: req.params.tourId };
  next();
};

exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.author) req.body.author = req.user.id;

  next();
};

exports.getAllReviews = handlerFactory.getAll(Review);
exports.getReview = handlerFactory.getOne(Review);
exports.createReview = handlerFactory.createOne(Review);
exports.updateReview = handlerFactory.updateOne(Review);
exports.deleteReview = handlerFactory.deleteOne(Review);
