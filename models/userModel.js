const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, 'name is required'],
    minLength: [3, 'name must be more than 2 charachtor'],
    maxLength: [30, 'name must be less than 30 charachtor'],
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'email is required'],
    lowercase: true,
    validate: [validator.isEmail, 'please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'lead', 'lead-guide'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'password is required'],
    minLength: [8, 'password must be at least 8 charachtor'],
    maxLength: [50, 'password must be lower than 50 charachtor'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'password confirm is required'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'password do not match',
    },
  },
  changedPasswordAt: {
    type: Date,
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

//===================================== document middlewares

userSchema.pre('save', async function (next) {
  // only if password is changed
  if (!this.isModified('password')) return next();

  // hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // delete confirm password
  this.passwordConfirm = undefined;

  //  Set changedPasswordAt
  this.changedPasswordAt = Date.now() - 1000;

  next();
});

// ================================== query middlewares

userSchema.pre(/^find/, async function (next) {
  // filter active accounts
  this.find({ active: { $ne: false } });
});

//================================================== methods

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.passwordChangedAfter = function (jwtTimeStamp) {
  if (this.changedPasswordAt) {
    const changeTimeStamp = parseInt(
      this.changedPasswordAt.getTime() / 1000,
      10,
    );

    return changeTimeStamp > jwtTimeStamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 1000 * 60;
  console.log(resetToken, this.passwordResetToken);

  return resetToken;
};

// ==================================== instantce and exports

const User = mongoose.model('User', userSchema);

module.exports = User;
