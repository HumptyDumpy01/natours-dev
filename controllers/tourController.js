const mongoose = require('mongoose');

const Tour = require(`./../models/tourModel`);
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');


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

exports.uploadTourImages = upload.fields([
  { name: `imageCover`, maxCount: 1 },
  { name: `images`, maxCount: 3 }
]);

exports.resizeTourImages = catchAsync(async function(req, res, next) {

  if (req.files.imageCover && !req.files.images) {
    return next();
  }

  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.png`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('png')
    .png({ quality: 80 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  req.body.images = [];

  // we do loop over all promises that returned from mapping the operation
  // and then resolving them in one go
  await Promise.all(req.files.images.map(async (file, index) => {
    const filename = `tour-${req.params.id}-${Date.now()}-${index + 1}.png`;

    await sharp(file.buffer)
      .resize(2000, 1333)
      .toFormat('png')
      .png({ quality: 80 })
      .toFile(`public/img/tours/${filename}`);

    req.body.images.push(filename);

  }));

  next();
});

exports.aliasTopTours = async function(req, res, next) {
  req.query.limit = 5;
  req.query.sort = `price -ratingsAverage`;
  req.query.fields = `title,price,ratingsAverage,summary,difficulty`;
  // console.log(`Hello from the aliasTopTours middleware`);
  next();
};

exports.checkID = async function(req, res, next, val) {

  if (!mongoose.isValidObjectId(val)) {
    return next(new AppError(`Failed to load a tour!`, 400));
  }

  const tour = await Tour.findOne({ _id: val });

  // this snippet of code is already checked in param middleware
  if (!tour) {
    return next(new AppError(`Failed to fetch a tour! The tour with the  ${val} id does not exist.`, 404));
  }
  next();

};

exports.getAllTours = factory.getAll(Tour);

exports.getTourById = factory.getOne(Tour, `Failed to fetch a tour!`, `Successfully fetched a specific tour.`,
  `reviews`);

exports.addNewTour = factory.createOne(Tour, `Failed to add a new Tour!`, `A New Tour is successfully added!`);

exports.updateTour = factory.updateOne(Tour, `Failed to update the tour!`, `Successfully updated the tour!`);

exports.deleteTour = factory.deleteOne(Tour, `Failed to delete a tour!`);

// `/tours-within/:distance/center/:49.57218434676016,34.51987182172493/unit/:unit`


/*exports.deleteTour = catchAsync(async function(req, res, next) {

  const { id } = req.params;

  // const response = await Tour.deleteOne({ _id: id });
  const deleteTour = await Tour.findByIdAndDelete(id);

  if (!deleteTour) {
    return next(new AppError(`Failed to delete a tour!`), 500);
  }

  res.status(204).json();

});*/

/*
exports.checkPostBody = function(req, res, next) {
  const { title, difficulty, price } = req.body;

  if (typeof title !== 'string' || title.trim().length === 0 ||
    typeof difficulty !== 'string' || difficulty.length === 0 ||
    typeof price !== 'number' || !price || !isFinite(price)) {
    res.status(400).json({
      status: `fail`,
      message: `Failed to add a tour! Incorrect format!`
    });
    return;
  }

  next();
};
*/

exports.getTourStats = catchAsync(async function(req, res, next) {
  const stats = await Tour.aggregate([
    {
      $match: {
        ratingsAverage: {
          $gte: 4.5
        }
      }
    }, {
      $group: {
        // _id: '$ratingsAverage',
        _id: { $toUpper: '$difficulty' },
        tours: { $sum: 1 },
        averageRating: {
          $avg: '$ratingsAverage'
        },
        averagePrice: {
          $avg: '$price'
        },
        minPrice: {
          $min: '$price'
        },
        maxPrice: {
          $max: '$price'
        },
        totalRatings: {
          $sum: '$ratingsQuantity'
        }
      }
    },
    {
      $project: {
        averageRating: {
          $round: [
            '$averageRating', 2
          ]
        },
        averagePrice: {
          $round: [
            '$averagePrice', 2
          ]
        },
        minPrice: 1,
        maxPrice: 1,
        totalRatings: 1,
        tours: 1
      }
    },
    {
      $sort: { 'averagePrice': -1 }
    }
    /*{
      $match: { 'totalRatings': { $nin: [45, 70] } }
    }*/

  ]);

  res.status(200).json({
    status: `success`,
    data: {
      stats: stats
    },
    message: `Statistics about the tours are successfully fetched!`
  });

});

exports.getMonthlyPlan = catchAsync(async function(req, res, next) {

  const year = Number(req.params.year);

  if (!year || !isFinite(year)) {
    return next(new AppError(`Incorrect year format! Please, specify a correct year param!`), 400);
  }

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: `$startDates` },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$title' }
      }
    },
    {
      $project: {
        month: '$_id',
        numTourStarts: 1,
        tours: 1,
        _id: 0
      }
    },
    {
      $sort: { numTourStarts: -1 }
    },
    {
      $limit: 20
    }
  ]);

  res.status(200).json({
    status: `success`,
    data: {
      plan
    },
    message: `Successfully got monthly plan stats!`
  });
});

/* INFO: THIS CONTROLLER is for accepting lat lng, distance, unit(mile or km) to
*   retrieve the closest items from some collection. This collection should have
*   the filed in GEOJSON format, and you should attach a 2dsphere index to it. */

exports.getToursWithin = catchAsync(async function(req, res, next) {
  const { distance, latlng, unit } = req.params;

  const [lat, lng] = latlng.split(`,`);

  if (!distance || !latlng || !unit || !lat || !lng) {
    return next(new AppError(`Invalid input data!`, 400));
  }

  // mongodb expects a radius of a sphere to be in "radiance"
  // it differs depending on whether the unit is in miles or kilometers
  const radius = unit === `mi` ? distance / 3963.2 : distance / 6378.1;

  /* IMPORTANT: USE YOUR OWN MODEL WHICH 2SPHERE INDEX. Based on it and the radiance
  *   the closest items would be retrieved.*/
  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius]
      }
    }
  });

  res.status(200).json({
    status: `success`,
    results: tours.length,
    data: {
      tours
    },
    message: `The closest items are successfully retrieved!`
  });
});

exports.getDistances = async function(req, res, next) {

  const { latlng, unit } = req.params;

  const [lat, lng] = latlng.split(`,`);

  if (!latlng || !unit || !lat || !lng) {
    return next(new AppError(`Invalid input data!`, 400));
  }

  const multiplier = unit === `mi` ? 0.000621371 : 0.001;

  /* IMPORTANT: USE YOUR OWN MODEL WHICH 2SPHERE INDEX. Based on it and the radiance
  *   the closest items would be retrieved.*/
  const distances = await Tour.aggregate([
    {
      // it is extremely important for the geoNear operator TO BE THE FIRST ONE in a pipeline. 
      // also, it expects that a Tour(in our example) schema contains 2dSphere index!
      $geoNear: {
        near: {
          type: `Point`,
          coordinates: [Number(lng), Number(lat)]
        },
        distanceField: `distance`,
        // this is the same as diving by thousand.
        // Yes. We can specify the multiplier, which would multipy the each distance by the value 
        // we specified.
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        title: 1
      }
    }
  ]);

  res.status(200).json({
    status: `success`,
    data: {
      data: distances
    },
    message: `The closest items are successfully retrieved!`
  });
};


