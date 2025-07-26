const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const handlerFactory = require('./handlerFactory');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) get Tours from DB
  const tours = await Tour.find();

  // 2) send response
  res.status(200).render('overview', {
    title: 'overview',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) get tour from DB
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: ['reviews', 'guides'],
  });

  if (!tour) return next(new AppError('there is no tour', 400));

  res.status(200).render('tour', {
    title: tour.name,
    tour,
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'login form',
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'my account',
  });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  res.status(200).render('account', {
    title: 'my account',
    user,
  });
});
