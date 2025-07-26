const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const User = require('./userModel');
const { toUSVString } = require('util');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, 'name is required'],
      trim: true,
      minLength: [2, 'min length: 2'],
      maxLength: [50, 'max length: 50'],
      // validate: [validator.isAlpha, 'must be only charector'],
    },
    price: {
      type: Number,
      required: [true, 'price is required'],
    },
    difficulty: {
      type: String,
      required: [true, 'difficulty is required'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'valid values: easy, medium, difficult',
      },
    },
    duration: {
      type: Number,
      required: [true, 'duration is required'],
    },
    slug: String,
    maxGroupSize: {
      type: Number,
      required: [true, 'MaxGroupSize is required'],
    },
    ratingsAverage: {
      type: Number,
      default: 5,
      min: [1, 'min value: 1'],
      max: [5, 'max value: 5'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'price discount({VALUE}) must be lower than price',
      },
    },

    summary: {
      type: String,
      trim: true,
      required: [true, 'summery is required'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'imageCover is required'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// index
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// local virtual
tourSchema.virtual('durationWeek').get(function () {
  return (this.duration / 7).toFixed(2);
});

// virtual populate

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// document middleware: before save()

tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);

//   next();
// });

// document middleware: after save()

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

//query middleware

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -changedPasswordAt',
  });
  next();
});

// aggregation middleware

// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
