const express = require('express');
const {
  getOverview,
  getTour,
  getLogin,
  getAccount,
  updateUserData,
  getMyBookings
} = require('../controllers/viewController');
const { isLoggedIn, protect } = require('../controllers/authController');
const { createBookingCheckout } = require('../controllers/bookingController');

// import the router from express
const router = express.Router();

// router.use(isLoggedIn);
/* TEMPORARY */
router.get(`/`, createBookingCheckout, isLoggedIn, getOverview);
// router.get(`/`, isLoggedIn, getOverview);

router.get(`/tours/:slug`, isLoggedIn, getTour);

router.get(`/login`, isLoggedIn, getLogin);

router.get(`/me`, protect, getAccount);

router.post(`/submit-user-data`, protect, updateUserData);

router.get(`/my-bookings`, protect, getMyBookings);

// ALWAYS export the router.
module.exports = router;
