const express = require('express');
const path = require('path');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//=========================== global middlewares

// serving static files
app.use(express.static(path.join(__dirname, 'public')));

// set scurity HTTP headers
if (process.env.NODE_ENV === 'production') {
  app.use(helmet());
}

// development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// set limit for amout of request of same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'too many request please try again one hour later',
});
app.use('/api', limiter);

// body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// data sanitization against NoSQL query injection
app.use(mongoSanitize());

//data sanitization against XSS
app.use(xss());

// prevent parameter pollution
app.use(
  hpp({
    whitelist: ['duration', 'price'],
  }),
);

//
// test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toDateString();
  next();
});

//===================================== route

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/', viewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`can not find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
