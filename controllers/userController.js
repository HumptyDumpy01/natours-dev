// const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const filterObj = require('../utils/filterObject');

// let's create a multer storage, where each added image would be stored
/*
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // specify the path where to store images(LOCAL PATH)
    cb(null, `public/img/users`);
  },
  filename: (req, file, cb) => {
    // user-454342frf-3244rrf.jpg
    const extension = file.mimetype.split(`/`)[1];
    cb(null, `user-${req.user._id}-${Date.now()}.${extension}`);
  }
});*/

// By doing so, we store images in a buffer first, for changing its size
// to fit our needs. This is a better approach.
const multerStorage = multer.memoryStorage();

// let's create multer filter as well.
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith(`image`)) {
    cb(null, true);
  } else {
    cb(new AppError(`Image is of a wrong type! Please provide a valid image!`, 400), false);
  }
};


// let's use storage and filter definitions to configure the upload
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});
// attach this controller onto a  route, like this
// router.patch(`/auth/updateMe`, uploadUserPhoto, updateMe);
// then attach a form data to a request, specify the "photo" key and the corresponding
// image

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError('No Image!', 400));

  req.file.filename = `user-${req.user._id}-${Date.now()}.png`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('png')
    .png({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});


// const users = JSON.parse(fs.readFileSync(`./dev-data/data/users.json`, `utf-8`));
///////////////////////////////////////
exports.getAllUsers = factory.getAll(User);
///////////////////////////////////////
exports.getUserById = factory.getOne(User, `Failed to fetch the user!`, `User Data is successfully fetched!`);
///////////////////////////////////////
exports.updateUser = factory.updateOne(User, `Failed to update the User!`, `The user is successfully Updated!`);
///////////////////////////////////////
exports.deleteUser = factory.deleteOne(User, `Failed to delete a User!`);
///////////////////////////////////////

exports.updateMe = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true
  });

  if (!updatedUser) {
    return next(new AppError('Failed to update the data!', 500));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});


exports.deleteMe = catchAsync(async function(req, res, next) {
  const { _id: userId } = req.user;
  const { oldPassword } = req.body;

  if (!oldPassword) {
    return next(new AppError(`Invalid input data! The old password is not specified!`, 401));
  }

  const user = await User.findById(userId).select(`+password`);

  if (!user) {
    return next(new AppError(`User does not exist!`, 404));
  }

  const passwordsMatch = await user.passwordsMatch(oldPassword, user.password);

  if (!passwordsMatch) {
    return next(new AppError(`Incorrect old password!`, 401));
  }

  await User.findByIdAndUpdate(userId, { active: false });

  res.status(204).json({
    status: `success`,
    data: null
  });
});


// it is considered a good practice to have /me API endpoint
// for extracting current user data
exports.getMe = async function(req, res, next) {
  req.params.id = req.user._id;
  next();
};

