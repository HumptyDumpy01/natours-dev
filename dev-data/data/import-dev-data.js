/* INFO: HOW TO RUN?
*   Have the data in collection already? Want to delete it first?
*   > node path_to_js_file --delete
*   want to import?
*   > node PATH_TO_JS_FILE --import */

// require the file system module
const fs = require('fs');

// require mongoose library
const mongoose = require('mongoose');
// require dotenv package
const dotenv = require('dotenv');

/* IMPORTANT: IMPORT YOUR OWN MODEL */
const Tour = require(`../../models/tourModel`);
const Review = require(`../../models/reviewModel`);
const User = require(`../../models/userModel`);

// specify the path to config.env
dotenv.config({
  // path: `./../../config.env`
  path: `config.env`
});

// connect to your mongodb database and replace password for a real one
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

// connect to db
mongoose.connect(DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true
}).then(() => {
  console.log('Mongo is successfully connected!');
});


// read json file
// const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`, `utf-8`));
/* IMPORTANT: SPECIFY THE LOCAL PATH TO IMPORT FROM */
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, `utf-8`));
const review = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, `utf-8`));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, `utf-8`));

// import data onto db
async function importData() {
  try {
    await Tour.create(tours);
    await Review.create(review);
    await User.create(users, {
      // with this, all the validation process would be skipped.
      validateBeforeSave: false
    });

    console.log(`Data is successfully imported to db!`);

  } catch (e) {
    throw new Error(`Failed to import he data!: ${e}`);
  }
  process.exit();
}

// delete all the data from a collection
async function deleteData() {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();

    console.log(`All tours that were in collection before injection were deleted!`);
  } catch (e) {
    throw new Error(`Failed to delete all tours before an injection! ${e}`);
  }
  process.exit();
}

// by postfixes --import or --delete (or anything) we can
// directly add fields to process.argv array and execute certain actions
if (process.argv[2] === `--import`) {
  importData();
}
if (process.argv[2] === `--delete`) {
  deleteData();
}

// console.log(process.argv);
