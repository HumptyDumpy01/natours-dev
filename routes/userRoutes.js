const express = require('express');
const router = express.Router();

const {
  deleteUser,
  getAllUsers,
  getUserById,
  updateUser,
  updateMe,
  deleteMe, getMe, uploadUserPhoto, resizeUserPhoto
} = require(`../controllers/userController`);

const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect, restrictTo, logout
} = require('../controllers/authController');

const authRouter = express.Router();

authRouter.post(`/login`, login);
authRouter.get(`/logout`, logout);
authRouter.post(`/signup`, signup);
authRouter.patch(`/resetPassword/:token`, resetPassword);
authRouter.delete(`/deleteMe`, protect, deleteMe);

router.use(`/auth`, authRouter);

router.post(`/auth/forgotPassword`, forgotPassword);

router.use(protect);

router.patch(`/auth/updatePassword`, updatePassword);
router.patch('/auth/updateMe', uploadUserPhoto, resizeUserPhoto, updateMe);
router.route(`/me`).get(getMe, getUserById);

// we can protect all routes coming below because
// each middleware executes in sequence
router.use(restrictTo(`admin`));

router.route(`/`)
  .get(getAllUsers);

router.route(`/:id`)
  .get(getUserById)
  .patch(updateUser)
  .delete(deleteUser);


module.exports = router;