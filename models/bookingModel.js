const mongoose = require('mongoose');
// validate: [validator.isAlpha, `A title should only contain letters (a-z)!`]
const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: `Tour`,
    required: [true, `The Booking must belong to a tour!`]
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: `User`,
    required: [true, `The User must belong to a tour!`]
  },
  price: {
    type: Number,
    required: [true, `The Price for a booking should be specified!`]
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  paid: {
    type: Boolean,
    default: true
  }

});

const Booking = mongoose.model(`Booking`, bookingSchema);

bookingSchema.pre(/^find/, function(next) {
  this.populate({
    // specify the field in your model that requires population
    path: `tour`,
    // select or exclude certain fields
    select: `title`
  });
  next();
});
/*

/!* IMPORTANT: TO SEE THE VIRTUAL IN QUERY RESULTS, WHENEVER YOU
*   fetch all items, include ".populate(`NAME_OF_VIRTUAL_PROP`); on a query"  *!/
bookingSchema.virtual(`unwoundTour`, {
  // from what collection is the reference? Where's parent referencing was done?
  ref: `Tour`,
  // foreign key means from a ref model where is the field
  // that should be populated from?k
  foreignField: `_id`,
  // The local field is about the current field in our schema from which
  // the comparison would be made. It is usually "_id"
  localField: `tour`
});
*/


module.exports = Booking;

