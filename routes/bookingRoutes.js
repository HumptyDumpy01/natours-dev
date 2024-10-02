const express = require('express');
const { protect, restrictTo } = require('../controllers/authController');
const {
  createPaymentSession,
  updateBooking,
  deleteBooking,
  getBooking,
  createBooking,
  getAllBookings
} = require('../controllers/bookingController');

// import your controllers from controllers folder.

// import the router from express
const router = express.Router();

router.use(protect);

router.get(`/checkout-session/:tourId`, createPaymentSession);

router.use(restrictTo(`admin`, `lead-guide`));

router.route(`/`)
  .post(createBooking)
  .get(getAllBookings);

router.route(`/:id`)
  .get(getBooking)
  .patch(updateBooking)
  .delete(deleteBooking);


// ALWAYS export the router.
module.exports = router;
