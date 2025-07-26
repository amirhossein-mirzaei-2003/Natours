const AppError = require('../utils/appError');
const Email = require('../utils/email');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');

const tokenSign = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = tokenSign(user.id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    sameSite: 'Lax',
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;
  user.active = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    photo: req.body.photo,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: 'user',
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 200, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1) email and password exist?
  if (!email || !password)
    return next(new AppError('please provide email and password', 400));

  // 2) check email exist and password is correct
  const user = await User.findOne({ email }).select('+password');
  let isCorrect;
  if (user) {
    isCorrect = await user.correctPassword(password, user.password);
  }

  if (!user || !isCorrect) {
    return next(new AppError('email or password is incorrect', 401));
  }

  // 3) user is valid now send token to client
  createSendToken(user, 200, res);
});

exports.isLogedIn = async (req, res, next) => {
  // 1) check token exist in client
  if (req.cookies.jwt) {
    try {
      // 2) verify token;
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      // 3) check user with this token still exists
      const user = await User.findOne({ _id: decoded.id });

      if (!user) {
        return next();
      }

      // 4) check if user changed the password after
      if (user.passwordChangedAfter(decoded.iat)) {
        return next();
      }

      // there is a loged in user, send it to template
      res.locals.user = user;
      return next();
    } catch (err) {
      return next();
    }
  }

  next();
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) check token exist in client
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('you are not loged in, please log in first', 401));
  }

  // 2) verify token;
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) check user with this token still exists
  const user = await User.findOne({ _id: decoded.id });

  if (!user) {
    return next(new AppError('user with this token no longer exists', 401));
  }

  // 4) check if user changed the password after
  if (user.passwordChangedAfter(decoded.iat)) {
    return next(
      new AppError(
        'password recently have been changed, please log in again!',
        401,
      ),
    );
  }

  res.locals.user = user;
  req.user = user;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('you do not have permission to perform this action', 401),
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) get user by posted email
  const user = await User.findOne({ email: req.body.email });

  if (!user) return next(new AppError('email is wrong', 404));

  // 2) generate random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) send token to email
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

  try {
    await new Email(user, resetURL).sendResetPassword();

    res.status(200).json({
      status: 'success',
      message: 'token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.log(err);

    return next(
      new AppError('there is issue for sending email, try again later!', 500),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get user by token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) check if token is valid or not expires
  if (!user) return next(new AppError('token is invalid of expires', 400));

  // 3) set new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  // 4) clear reset token
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // 5) save new changes to DB
  await user.save();

  // 6) log user in and send new LOGIN token
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) get current user
  const user = await User.findById(req.user.id).select('+password');

  // 2) check POSTED password
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('password is not correct', 401));
  }

  // 3) set new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4) log user in and send token
  createSendToken(user, 200, res);
});

exports.logout = catchAsync(async (req, res, next) => {
  res.cookie('jwt', 'loged out', {
    expires: new Date(Date.now() + 10 * 1000),
  });

  res.status(200).json({
    status: 'success',
  });
});
