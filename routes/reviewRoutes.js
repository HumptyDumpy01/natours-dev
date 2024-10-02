const express = require('express');

// import, if needed, a protect controller. (JWT)
const { protect, restrictTo } = require('../controllers/authController');
// import your controllers from controllers folder.
const {
  getAllReviews,
  getMyReviews,
  createNewReview,
  deleteReview,
  updateReview, setTourUserIds, getReview
} = require('../controllers/reviewController');

// import the router from express
const router = express.Router({
  mergeParams: true
});

// instead of specifying the "protect" controller everywhere, we can
// attach it via use to the main router of all controllers here
router.use(protect);

router.route(`/`)
  // attach any method you want for e.g. root route.
  // protect is used in JWT token security (use lucia instead)
  // the last controller should be an actual controller.
  .get(restrictTo(`admin`, `lead-guide`),
    getAllReviews)
  .post(restrictTo(`user`), setTourUserIds, createNewReview);

router.route(`/:id`)
  .delete(restrictTo(`admin`, `user`), deleteReview)
  .patch(restrictTo(`admin`, `user`), updateReview)
  .get(getReview);

router.route(`/myReviews`)
  .get(getMyReviews);

// ALWAYS export the router.
module.exports = router;

