const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'review can not be empty'],
    },
    rating: {
      type: Number,
      min: [1, 'min value: 1'],
      max: [5, 'max value: 5'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    author: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a User'],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a Tour'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
// index

reviewSchema.index({ tour: 1, author: 1 }, { unique: true });

// query middleware

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'author',
    select: 'name photo',
  });

  next();
});

// static function (for whole schema, not only instance)

reviewSchema.statics.calcRatingAverage = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        avgRatings: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingQuantity: stats[0].nRatings,
      ratingsAverage: stats[0].avgRatings.toFixed(1),
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingQuantity: 0,
      ratingsAverage: 5,
    });
  }
};

// document middleware after save

reviewSchema.post('save', function () {
  // this.constructor = Review
  this.constructor.calcRatingAverage(this.tour);
});

reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) await doc.constructor.calcRatingAverage(doc.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
