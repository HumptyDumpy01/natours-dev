const catchAsync = require('../utils/catchAsync');

const AppError = require('../utils/appError');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const mongoose = require('mongoose');
const Booking = require('../models/bookingModel');

// create your controller that would be attached to the route
exports.getOverview = catchAsync(async function(req, res, next) {
  /* 1. Get Tour data from collection */
  const tours = await Tour.find();

  if (!tours) {
    return next(new AppError(`We were unable to get the tours!`, 500));
  }

  res.status(200).render(`overview`, {
    title: `All tours`,
    tours
  });

});

exports.getTour = catchAsync(async function(req, res, next) {
  const { slug } = req.params;
  const tour = await Tour.findOne({ slug }).populate(`reviews`);

  if (!tour) {
    return next(new AppError(`Failed to find the tour!`, 404));
  }

  // IMPORTANT: SET CSP HEADER FOR MAPBOX TO WORK PROPERLY
  /*res.set(
    'Content-Security-Policy',
    'connect-src https://!*.tiles.mapbox.com https://api.mapbox.com https://events.mapbox.com'
  );*/

  res.set(
    'Content-Security-Policy',
    'connect-src \'self\' http://localhost:8001 https://*.js.stripe.com https://js.stripe.com https://m.stripe.network'
  );

  res.status(200).render(`tour`, {
    title: tour.title,
    tour
  });
});

exports.getLogin = catchAsync(async function(req, res, next) {
  res.set({
    'Content-Security-Policy': 'connect-src \'self\' http://127.0.0.1:8001/',
    'Access-Control-Allow-Origin': '*', // Allow requests from any origin
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', // Allow specific HTTP methods
    'Access-Control-Allow-Headers': 'Content-Type, Authorization' // Allow specific headers
  });

  res.status(200).render('login', {
    title: 'Login'
  });
});

exports.getAccount = catchAsync(async function(req, res, next) {
  res.set({
    'Content-Security-Policy': 'connect-src \'self\' http://127.0.0.1:8001/',
    'Access-Control-Allow-Origin': '*', // Allow requests from any origin
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', // Allow specific HTTP methods
    'Access-Control-Allow-Headers': 'Content-Type, Authorization' // Allow specific headers
  });
  res.status(200).render(`account`, {
    title: `Your Account`
  });
});

exports.updateUserData = catchAsync(async function(req, res, next) {
  const { _id: id } = req.user;
  const { email, name } = req.body;

  const updatedUser = await User.findByIdAndUpdate(id, {
    email,
    name
  }, {
    // this means we want to get a new updated document as a result
    new: true,
    // validate these fields
    runValidators: true
  });

  if (!updatedUser) {
    return next(new AppError(`Failed to update the user!`, 500));
  }

  res.status(200).render(`account`, {
    title: `Account Settings`,
    user: updatedUser
  });

});


exports.getMyBookings = catchAsync(async function(req, res, next) {
  const { id } = req.user;

  // const bookings = await Booking.find({ user: id }).populate(`unwoundTour`);

  // const bookings = await Booking.find({ user: id }).populate({
  //   path: `tour`,
  //   select: `-guides -images -description -locations -secretTour`
  // });
  const bookings = await Booking.find({ user: id });

  const tourIds = bookings.map((item) => item.tour);

  const tours = await Tour.find({ _id: { $in: tourIds } });

  // console.log(`Executing tours: `, tours);

  res.status(200).render(`overview`, { title: `My Tours`, tours });
});


