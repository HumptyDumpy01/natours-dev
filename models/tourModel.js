const mongoose = require('mongoose');
const slugify = require('slugify');
const User = require('./userModel');
// const validator = require('validator');

const tourSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, `A title should not be empty!`],
    unique: true,
    trim: true,
    maxlength: [70, `A tour title should be at max 70 characters.`],
    minlength: [5, `A tour should have at least 5 characters.`]
    // validate: [validator.isAlpha, `A title should only contain letters (a-z)!`]
  },
  slug: {
    type: String,
    trim: true
  },
  duration: {
    type: Number,
    required: [true, `A tour must have a duration!`],
    min: 1
  },
  maxGroupSize: {
    type: Number,
    required: [true, `A tour must have a group size!`],
    min: 0
  },
  difficulty: {
    type: String,
    required: [true, `A difficulty should be specified!`],
    default: `easy`,
    trim: true,
    enum: {
      values: [`easy`, `medium`, `difficult`],
      message: `The Difficulty can be easy|medium|difficult only!`
    }
  },
  ratingsAverage: {
    type: Number,
    default: 4.4,
    min: 0,
    max: 5,
    set: (val) => Math.round(val * 10) / 10
  },
  ratingsQuantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  price: {
    type: Number,
    required: [true, `The Price should be specified!`],
    min: 0
  },
  priceDiscount: {
    type: Number,
    validate: {
      validator: function(val) {
        // this validator WON'T work on update!
        return this.price > val;
      },
      message: `The Price discount(({VALUE})) cannot be higher than actual price!`
    }
  },
  summary: {
    type: String,
    trim: true,
    required: [true, `The Summary should be specified!`],
    maxlength: [700, `Summary should be up to 700 chars only!`],
    minlength: [10, `Summary should be at least 10 chars!`]
  },
  description: {
    type: String,
    trim: true,
    required: [true, `The Description should be specified!`],
    maxlength: [1600, `Description should be up to 1600 chars only!`],
    minlength: [10, `Description should be at least 10 chars!`]
  },
  imageCover: {
    type: String,
    trim: true,
    required: [true, `An Image Cover is not specified!`]
  },
  images: {
    type: [String],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false
  },
  startDates: [Date],
  secretTour: {
    type: Boolean,
    default: false
  },
  startLocation: {
    // GEOJSON
    type: {
      type: `String`,
      default: `Point`,
      enum: [`Point`]
    },
    coordinates: [Number],
    address: String,
    description: String
  },
  locations: [{
    type: {
      type: String,
      default: `Point`,
      enum: [`Point`]
    },
    coordinates: [Number],
    address: String,
    description: String,
    day: Number
  }],
  // guides: Array
  guides: [
    {
      type: mongoose.Schema.ObjectId,
      ref: User
    }
  ]
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// this is a single field index.
// tourSchema.index({ price: 1 });

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

// EXAMPLE: tourSchema.index({ price: 1 });
tourSchema.index({ startLocation: '2dsphere' });


tourSchema.virtual(`durationWeek`).get(function() {
  return this.duration / 7;
});

// "Virtual populate". With this one we are able to query the tours
// and its corresponding reviews

/* IMPORTANT: TO SEE THE VIRTUAL IN QUERY RESULTS, WHENEVER YOU
*   fetch all items, include ".populate(`NAME_OF_VIRTUAL_PROP`); on a query"  */

tourSchema.virtual(`reviews`, {
  ref: `Review`,
  // foreign key means from a ref model where is the field
  // that should be populated from?k
  foreignField: `tour`,
  // The local field is about the current field in our schema from which
  // the comparison would be made. It is usually "_id"
  localField: `_id`
});

/* INFO: DOCUMENT MIDDLEWARE */
// this middleware runs on .save() and .create() ONLY ONLY ONLY
// this is a pre-hook middleware that would be called each time when
// a document gonna be inserted
tourSchema.pre(`save`, function(next) {
  // the "this" keyword would point to the currently processed object
  // console.log(this);
  this.slug = slugify(this.title, {
    lower: true
  });
  next();
});

/* INFO: QUERY MIDDLEWARE */
// tourSchema.pre(`find`, function(next) {
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

// this pre-hook middleware runs for all find* queries before the response
// is sent
tourSchema.pre(/^find/, function(next) {
  this.populate({
    // specify the field in your model that requires population
    path: `guides`,
    // select or exclude certain fields
    select: `-passwordChangedAt -__v`
  });
  next();
});

tourSchema.post(/^find/, function(docs, next) {
  // console.log(docs);
  // console.log(`Query took: ${Date.now() - this.start} milliseconds!`);
  next();
});

/* INFO: AGGREGATION MIDDLEWARE */

// tourSchema.pre(`aggregate`, function(next) {
//   // the "this" keyword points to a current pipeline.
//
//   // here we exclude the tours with secretTour set to true
//   // console.log(this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }));
//   next();
// });
//
//

const Tour = mongoose.model(`Tour`, tourSchema);

module.exports = Tour;
