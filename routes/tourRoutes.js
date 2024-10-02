const express = require('express');
const {
  getAllTours,
  addNewTour,
  deleteTour,
  getTourById,
  updateTour,
  checkID,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances, resizeTourImages, uploadTourImages
} = require(`../controllers/tourController`);

const { protect, restrictTo } = require('../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

router.route(`/distances/:latlng/unit/:unit`).get(getDistances);

router.route(`/tours-within/:distance/center/:latlng/unit/:unit`).get(getToursWithin);

router.use(`/:tourId/reviews`, reviewRouter);

router.route(`/get-monthly-plan/:year`).get(protect, restrictTo(`admin`, `guide`, `lead-guide`), getMonthlyPlan);

router.route(`/get-stats`).get(getTourStats);

router.route(`/top-5-cheap`)
  .get(aliasTopTours, getAllTours);

// this one is param middleware.
router.param(`id`, checkID);

router.route(`/`)
  .get(getAllTours)
  // .post(checkPostBody, addNewTour);
  .post(protect, restrictTo(`admin`, `lead-guide`), addNewTour);

router.route(`/:id`)
  .get(getTourById)
  .patch(protect, restrictTo(`admin`, `lead-guide`), uploadTourImages, resizeTourImages, updateTour)
  .delete(protect, restrictTo(`admin`), deleteTour);


module.exports = router;
