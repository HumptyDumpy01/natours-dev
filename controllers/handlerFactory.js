const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const mongoose = require('mongoose');
const APIFeatures = require('../utils/apiFeatures');

// CONTROLLERS: All Controllers are about CRUD. You can read one, read many.
// delete/create/update any document by using this factory.
exports.deleteOne = (Model, errMessage) => catchAsync(async function(req, res, next) {
  const { id } = req.params;
  const doc = await Model.findByIdAndDelete(id);

  if (!doc) {
    return next(new AppError(errMessage), 500);
  }

  res.status(204).json({
    status: `success`,
    data: null
  });

});

/* IMPORTANT: DO NOT RUN THIS WHEN UPDATING THE PASSWORD - VALIDATION WON'T WORK */
exports.updateOne = (Model, errMessage, successMessage) => catchAsync(async function(req, res, next) {
  // SPECIFY THE ID OF A DOCUMENT TO UPDATE IT.
  // IN REQ.BODY SHOULD BE THE ACTUAL DOC WITH NEW VALS FOR FIELDS
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return next(new AppError('Invalid input data!', 400));
  }

  // Check if the user exists
  const existingDoc = await Model.findById(id);
  if (!existingDoc) {
    return next(new AppError('User not found!', 404));
  }

  // Update the user document
  const doc = await Model.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true
  });

  // console.log(`Executing doc: `, doc);

  if (!doc) {
    return next(new AppError(errMessage, 500));
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: doc
    },
    message: successMessage
  });
});

exports.createOne = (Model, errMessage, successMessage) => catchAsync(async function(req, res, next) {

  const doc = await Model.create(req.body);

  res.status(201).json({
    status: `success`,
    data: {
      data: doc
    },
    message: successMessage
  });
  // tours.push(doc);
});

exports.getOne = (Model, errMessage, successMessage, populateOpts) => catchAsync(async function(req, res, next) {
  // access the param manually
  // const id = req.body.id;
  // or you can access the param via "params" object.
  // const params = req.params;
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return next(new AppError(`The id ${id} is incorrect!`, 400));
  }

  let query = Model.findById(id);

  if (populateOpts) {
    query = query.populate(populateOpts);
  }

  const doc = await query;

  if (!doc) {
    return next(new AppError(errMessage, 500));
  }

  res.status(200).json({
    status: `success`,
    data: {
      data: doc
    },
    message: successMessage
  });

});

exports.getAll = (Model) => async function(req, res, next) {

  // this is done to allow nested reviews on tour
  let filter;
  if (req.params.tourId) {
    filter = { tour: req.params.tourId };
  }

  const features = new APIFeatures(Model.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  // awaiting documents
  // const doc = await features.query.explain();
  const doc = await features.query;

  res.status(200).json({
    status: `success`,
    results: doc.length,
    data: {
      data: doc
    }
  });
};

