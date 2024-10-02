const catchAsync = require('../utils/catchAsync');
const mongoose = require('mongoose');
const AppError = require('../utils/appError');
const Tour = require('../models/tourModel');
const factory = require('./handlerFactory');


const dotenv = require('dotenv');
const Booking = require('../models/bookingModel');

dotenv.config({
  path: `${__dirname}/../config.env`
});

const stripe = require('stripe')(process.env.STRIPE_SECRET);

exports.createPaymentSession = catchAsync(async function(req, res, next) {
  const { tourId } = req.params;

  if (!mongoose.isValidObjectId(tourId)) {
    return next(new AppError(`Incorrect id specified!`, 400));
  }

  const tour = await Tour.findById(tourId);

  if (!tour) {
    return next(new AppError(`Failed to load the tour!`, 404));
  }

  // Create a price object in Stripe
  const price = await stripe.prices.create({
    unit_amount: tour.price * 100, // Convert to cents
    currency: 'usd',
    product_data: {
      name: tour.title
    }
  });

  // Create a checkout session
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: price.id,
        quantity: 1
      }
    ],
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/?tour=${tour._id}&user=${req.user._id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tours/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: tourId
  });

  res.status(200).json({
    status: 'success',
    session
  });
});

exports.createBookingCheckout = catchAsync(async function(req, res, next) {
  /* TEMPORARY SOLUTION. This one is insecure */
  const { tour, user, price } = req.query;

  if (!mongoose.isValidObjectId(tour) || !mongoose.isValidObjectId(user) || !price) {
    return next();
  }

  await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split(`?`)[0]);

});

exports.createBooking = factory.createOne(Booking, `Failed to create the booking!`, `The booking was successfully created!`);

exports.getBooking = factory.getOne(Booking, `Failed to fetch the booking!`, `The booking was successfully fetched!`);

exports.getAllBookings = factory.getAll(Booking);

exports.updateBooking = factory.updateOne(Booking, `Failed to update the booking!`, `Successfully updated booking!`);

exports.deleteBooking = factory.deleteOne(Booking, `Failed to delete the booking!`);
