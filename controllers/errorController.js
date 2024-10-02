const AppError = require('../utils/appError');

const sendErrorDev = (err, req, res) => {

  if (req.originalUrl.startsWith(`/api`)) {

    return res.status(err.statusCode).json({
      status: err.status,
      message: `Error! ${err.message}`,
      error: err,
      stack: err.stack
    });
  }

  return res.status(404).render(`error`, {
    title: `Something went wrong!`,
    msg: err.message
  });

  /*
    // this one is an operational and trustable error
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: `Error! ${err.message}`,
        error: err,
        stack: err.stack
      });
      // Programing or some other 3rd party error occurred.
      // We should not leak eny extra details to the client.
    } else {
      console.error(`ERROR HAS OCCURRED`, err);
      res.status(500).json({
        status: `error`,
        message: `${err.message}`
      });
    }*/

};

const sendErrorProd = function(err, req, res) {
  if (req.originalUrl.startsWith(`/api`)) {

    return res.status(err.statusCode).json({
      status: err.status,
      message: `An Error Occurred! ${err.message}`
    });
  }

  return res.status(404).render(`error`, {
    title: `Something went wrong!`,
    msg: err.message
  });

};

const handleJWTError = () => new AppError(`Invalid token! Please log in again!`, 401);

const handleJWTExpired = () => new AppError(`Token has expired! Please log in again!`, 401);


module.exports = (err, req, res, next) => {
  // console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || `error`;

  if (process.env.NODE_ENV === `development`) {
    sendErrorDev(err, req, res);
    return;
  }

  if (process.env.NODE_ENV === `production`) {
    let error = { ...err };

    if (error.name === `JsonWebTokenError`) {
      error = handleJWTError(error);
    }
    if (error.name === `TokenExpiredError`) {
      error = handleJWTExpired();
    }

    // sendErrorProd(err, res);
    sendErrorProd(err, req, res);
  }

};
