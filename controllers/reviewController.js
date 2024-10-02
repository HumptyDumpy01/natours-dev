// Import your model
const mongoose = require('mongoose');

const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
const Tour = require('../models/tourModel');
const factory = require('./handlerFactory');

exports.setTourUserIds = async function(req, res, next) {

  // here user can manually specify the user id and tourId if any,
  // otherwise I assume it to extract user from req and the tourId from URL
  const tourId = req.body.tour ? req.body.tour : req.params.tourId;
  const user = req.body.user ? req.body.user : req.user;

  const data = req.body;

  if (!user || !data || !mongoose.isValidObjectId(tourId)) {
    return next(new AppError(`Invalid Request!`, 400));
  }

  const tour = await Tour.findById(tourId);

  if (!tour) {
    return next(new AppError(`Tour is not found!`, 404));
  }

  const newData = {
    ...data,
    user,
    tour: tourId
  };

  req.body = newData;

  next();
};

exports.getMyReviews = catchAsync(async function(req, res, next) {
  const { user: userObj } = req;

  const user = await User.findById(userObj._id);

  if (!user) {
    return next(new AppError(`User does not exist!`, 404));
  }

  const reviews = await Review.find({ user: userObj._id });

  if (!reviews || reviews.length === 0) {
    return next(new AppError(`There were no reviews found for user!`, 404));
  }

  res.status(200).json({
    status: `success`,
    result: reviews.length,
    data: {
      reviews
    },
    message: `Successfully fetched all user reviews!`
  });
});

///////////////////////////////////////

exports.getAllReviews = factory.getAll(Review);
///////////////////////////////////////
// create your controller that would be attached to the route
exports.createNewReview = factory.createOne(Review, `Failed to add a new review!`, `Review is successfully added!`);
///////////////////////////////////////
exports.deleteReview = factory.deleteOne(Review, `Failed to delete a review!`);
///////////////////////////////////////
exports.updateReview = factory.updateOne(Review, `Failed to update the Review!`);
///////////////////////////////////////
exports.getReview = factory.getOne(Review, `Failed to get a review!`);

