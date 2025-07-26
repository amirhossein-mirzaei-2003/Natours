const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const User = require('./../models/userModel');
const handlerFactory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

// multer
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     // user-ID-TIME.EXT => user-344634235v-34523453.jpg
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('not an image! please upload only images.', 400));
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// update user data filter
const filterObj = (obj, ...allowedFields) => {
  const result = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      result[el] = obj[el];
    }
  });

  return result;
};

// controllers
exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  sharp(req.file.buffer)
    .rotate()
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
};

exports.getMe = catchAsync(async (req, res, next) => {
  req.params.id = req.user.id;

  next();
});
exports.updateMe = catchAsync(async (req, res, next) => {
  console.log(req.body);
  console.log(req.file);
  // 1) changing password not possible here
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('changing password is not possible here', 401));
  }

  // 2) filter allowed fields
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  // 3) get and update user
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  // 4) send response
  res.status(200).json({
    status: 'success',
    user: updatedUser,
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { active: false },
    {
      new: true,
      runValidators: true,
    },
  );

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not defined! use /signUp url',
  });
};

exports.getAllUsers = handlerFactory.getAll(User);
exports.getUser = handlerFactory.getOne(User);
exports.updateUser = handlerFactory.updateOne(User);
exports.deleteUser = handlerFactory.deleteOne(User);
