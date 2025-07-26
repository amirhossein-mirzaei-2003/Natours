const { appendFile } = require('fs');
const AppError = require('./../utils/appError');

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
      nameee: err.name,
    });
  }

  return res.status(err.statusCode).render('error', {
    title: 'error',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // 1) api
  if (req.originalUrl.startsWith('/api')) {
    // operational, trusted error
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
      // programming, enknown error
    }
    console.error('error❌', err, err.name);
    return res.status(500).json({
      status: 'error',
      message: 'somthing went very wrong',
    });
  }

  // 2) rendered website
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'error',
      msg: err.message,
    });
    // programming, enknown error
  }
  console.error('error❌', err, err.name);
  return res.status(500).render('error', {
    title: 'error',
    msg: 'something went wrong, try again later!',
  });
};

const handleCastErrorDB = (err) => {
  const message = `invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateNameError = (err) => {
  const fields = Object.keys(err.keyValue).join(', ');
  const message =
    fields === 'tour,author'
      ? 'You have already submitted a review for this tour.'
      : `Duplicate field value(s): ${fields}`;
  return new AppError(message, 400);
};

const handleValidationError = (err) => {
  const value = Object.values(err.errors)
    .map((el) => el.message)
    .join('. ');
  const message = `invalid input data(${value})`;
  return new AppError(message, 400);
};

const handleJsonWebTokenError = () => {
  const message = 'invalid token, please log in again!';
  return new AppError(message, 401);
};

const handleTokenExpiredError = () => {
  const message = 'token expired, please log in again!';
  return new AppError(message, 401);
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    error.name = err.name;
    error.errmsg = err.errmsg;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateNameError(error);
    if (error.name === 'ValidationError') error = handleValidationError(error);
    if (error.name === 'JsonWebTokenError') error = handleJsonWebTokenError();
    if (error.name === 'TokenExpiredError') error = handleTokenExpiredError();
    sendErrorProd(error, req, res);
  }
};
