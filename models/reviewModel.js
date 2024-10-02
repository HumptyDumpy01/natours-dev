const mongoose = require('mongoose');
const User = require('./userModel');
const Tour = require('./tourModel');

const ReviewSchema = new mongoose.Schema({
  review: {
    type: String,
    trim: true,
    maxlength: [1500, `The Review cannot exceed 1500 characters!`],
    minlength: [10, `The Review should be at least 10 characters!`],
    required: [true, `The Review should not be empty!`]
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, `Please, specify  the rating!`]
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: Tour,
    required: [true, `The Review should belong to a specific tour!`]
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: User,
    required: [true, `The Review should belong to a specific user!`]
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// each user can only leave one review on one tour
ReviewSchema.index({ user: 1, tour: 1 }, { unique: true });

// this pre-hook middleware runs for all find* queries before the response
// is sent

ReviewSchema.pre(/^find/, function(next) {
  // it is not that important tour to be populated at all.
  this/*.populate({
    // specify the field in your model that requires population
    path: `tour`,
    // select or exclude certain fields
    select: `title`
  })*/.populate({
    path: `user`,
    select: `name photo`
  });

  next();
});

ReviewSchema.statics.calcAverageRatings = async function(tourId) {
  // the "this" points to a current MODEL
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: 'tour',
        nRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRatings,
      ratingsAverage: stats[0].avgRating
    });

  } else {

    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }

};

ReviewSchema.pre(/^findOneAnd/, async function(next) {
  this.review = await this.findOne();

  next();
});

ReviewSchema.post(/^findOneAnd/, async function() {
  await this.review.constructor.calcAverageRatings(this.review.tour);
});

ReviewSchema.post(`save`, async function() {
  // "this" points to the current review
  this.constructor.calcAverageRatings(this.tour);
});

const Review = mongoose.model(`Review`, ReviewSchema);

module.exports = Review;
