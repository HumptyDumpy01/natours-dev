// require express module
const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const cors = require('cors');

const { webhookCheckout } = require('./controllers/bookingController');
const AppError = require(`${__dirname}/utils/appError`);
const errorController = require(`${__dirname}/controllers/errorController`);

const morgan = require('morgan');
// use application to get access to express
const app = express();


// include static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, `public`)));

app.set(`view engine`, `pug`);
// This would join the actual dir path and the /views
// We do not always know whether the path contains "/" or not. So path.join prevents
// us from this sort of bug
app.set(`views`, path.join(__dirname, `views`));

// the empty cors() enables using of our APIs from any domain
// if you want to add it only to a specific route, then add cors() as a part of
// route middleware
app.use(cors());

// this is necessary to enable "options" request for not simple crud operations like
// patch, put, delete
app.options(`*`, cors());

// we can also specify the options allowed for a specific domain or a route(!)
// app.options(`https://www.natours.com`, cors());
// app.options(`/api/v1/tours/:id`, cors());

// specify a specific domain
/*
app.use(cors({
  origin: `https://www.natours.com`
}));
*/

const userRouter = require(`${__dirname}/routes/userRoutes`);
const tourRouter = require(`${__dirname}/routes/tourRoutes`);
const reviewRouter = require(`${__dirname}/routes/reviewRoutes`);
const viewRouter = require(`${__dirname}/routes/viewRoutes`);
const bookingRouter = require(`${__dirname}/routes/bookingRoutes`);

// Security HTTP headers.
app.use(helmet());

// enabling middleware

// this route WON'T work with json but only with read stream.
// that's why we should use this middleware before express.json
app.post(`/webhook-checkout`, express.raw({ type: `application/json` }), webhookCheckout);

// body parser
app.use(express.json({
  // limit the body to 10 kb.
  limit: `10kb`
}));

app.use(cookieParser());

/* INFO: DATA SANITIZATION  */

/* data sanitization against query injection */
app.use(mongoSanitize());

/* data sanitization against XSS attacks */
app.use(xss());

// hpp for prevent parameter pollution
app.use(hpp({
  // whitelist all query strings where duplicates are allowed
  whitelist: [`duration`, `ratingsQuantity`, `ratingsAverage`, `maxGroupSize`, `difficulty`, `price`]
}));

// this middleware works only FOR TEXT
app.use(compression());

if (process.env.NODE_ENV === `development`) {
  app.use(morgan('dev'));
}

// Limit requests for Denial of Service protection
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: `Too many requests are made! Please try again later!`
});

app.use(`/api`, limiter);

// this is only necessary if you gonna submit forms in a traditional way
// when the user clicks on btn and the request is sent to a server via url
app.use(express.urlencoded({ extended: true, limit: `10kb` }));

// creating a custom middleware stack
app.use((req, res, next) => {
  // console.log(`Hello from the middleware!`);
  // console.log(req.cookies);
  next();
});

// this middleware executes for any request
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// thus we can create sub applications, and this is
// necessary for clear code
// Mounting our routes

app.use(`/`, viewRouter);

app.use(`/api/v1/tours`, tourRouter);
app.use(`/api/v1/users`, userRouter);
app.use(`/api/v1/reviews`, reviewRouter);
app.use(`/api/v1/bookings`, bookingRouter);


// 404 ERROR HANDLING
app.all(`*`, (req, res, next) => {
  /* INFO: Whenever we pass onto the next function, express thinks that this is an error,
  *   and the error bubble up to the error handling middleware, if any. */
  // next(err);
  next(new AppError(`Failed to find ${req.originalUrl} API route!`, 404));
});

app.use(errorController);

module.exports = app;
