const { promisify } = require('util');
const crypto = require('crypto');

const jwt = require('jsonwebtoken');
const Email = require('../utils/email');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const signToken = function(userId) {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
  return token;
};

const createAndSendToken = function(res, status, statusMessage, user, dataReturned, message) {

  /* 4. Log user in, send JWT */
  const signInToken = signToken(user._id);
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    // secure: true,
    httpOnly: true
  };

  if (process.env.NODE_ENV === `production`) {
    cookieOptions.secure = true;
  }
  res.cookie(`jwt`, signInToken, cookieOptions);

  // exclude the password from the token
  user.password = undefined;

  res.status(status).json({
    status: statusMessage,
    token: signInToken,
    data: dataReturned,
    message: message
  });
};

exports.signup = catchAsync(async function(req, res, next) {
  const { name, email, password, confirmPassword, passwordChangedAt } = req.body;

  const newUser = await User.create({
    name, email, password, confirmPassword, passwordChangedAt
  });

  const url = `${req.protocol}://${req.get(`host`)}/me`;
  // console.log(`Executing url: `, url);

  await new Email(newUser, url).sendWelcome();

  createAndSendToken(res, 201, `success`, newUser,
    { user: newUser },
    `The New account was successfully created!`);
});

exports.login = catchAsync(async function(req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError(`Invalid Input Data!`, 400));
  }

  const user = await User.findOne({ email }).select(`+password`);

  if (!user || !await user.passwordsMatch(password, user.password)) {
    return next(new AppError(`Invalid email or password`, 401));
  }

  createAndSendToken(res, 200, `success`, user,
    { user: user },
    `You successfully logged in!`);

});

/* INFO: THIS MIDDLEWARE CHECKS IF USER IS AUTHENTICATED(VIA JWT)
*   and then sends an error if not, otherwise the next middleware stack object would be executed. */
exports.protect = catchAsync(async function(req, res, next) {
  // 1. Get access to a token

  // If we use JWTs here, then each authenticated user would have a JWT token
  // assigned to each request. We can easily extract it via headers and authentication key

  let token;
  if (req.headers.authorization || String(req.headers.authorization).startsWith(`Bearer`)) {
    token = req.headers.authorization.split(` `)[1];
  }

  if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError(`You are not logged in. Please sign in to get access to this resource.`, 401));
  }

  // console.log(`Executing token: `, token);

  // 2. Verify token
  const decodedToken = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3. If verified, check if the user still exists,
  // console.log(decodedToken);

  // connecting to a mongodb database and checking if user still exists.
  const user = await User.findById(decodedToken.id);

  if (!user) {
    return next(new AppError(`Access denied! User does not exist`, 401));
  }

  // 4. Check if the user changed the password before after JWT was generated
  if (user.changedPasswordAfter(decodedToken.iat)) {
    return next(new AppError(`The token is outdated! Please log in again!`, 401));
  }

  // this would grant us access to the auth user data
  // thus next middleware controllers in a middleware stack would be able to use this data
  req.user = user;
  // this locals in needed for pug templates to access user
  res.locals.user = user;
  // next effectively grants access to a protected resource.
  next();
});

/* IMPORTANT: USAGE
*   we pass multiple stings onto this function, and then it checks whether
*   the user role(added via another middleman function BEFORE) includes the
*   allowed role or not */

/* INFO: EXAMPLE OF USAGE
    router.route(`/`)
    .get(protect, restrictTo(`admin`), getAllUsers);
*    */

exports.logout = catchAsync(async function(req, res, next) {
  res.cookie(`jwt`, `loggedOut`, {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({
    status: `success`,
    message: `User is successfully logged out.`
  });
});


exports.restrictTo = function(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      // 403 is about "forbidden"
      return next(new AppError(`Access denied! You do not have access for this action!`, 403));
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async function(req, res, next) {
  const { email } = req.body;

  if (!email) {
    return next(new AppError(`Invalid email!`, 400));
  }

  // 1. Get user based on the POSTed email
  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError(`Failed to find a user with ${email} email!`, 404));
  }

  // 2. Generate the random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // console.log(`Executing resetToken: `, resetToken);

  // 3. Send it back to his email
  const resetURL = `${req.protocol}://${req.get(`host`)}/api/v1/users/auth/resetPassword/${resetToken}`;

  try {
    await new Email(user, resetURL).sendResetPassword();

    res.status(200).json({
      status: `success`,
      message: `Successfully sent a reset password token to ${user.email}`
    });

  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError(`Failed to send an email about reset password token!`, 500));
  }

});

exports.resetPassword = catchAsync(async function(req, res, next) {
  /* 1. Get user based on the token */
  const { token } = req.params;

  if (!token) {
    return next(new AppError(`Token does not exist! Please try again!`, 400));
  }

  const hashedToken = crypto.createHash(`sha256`)
    .update(token)
    .digest(`hex`);

  const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });


  /* 2. Reset a password only if
  *   the user exists and token is not expired. */
  if (!user) {
    return next(new AppError(`The token has expired or invalid!`, 400));
  }

  /* 3. Update the changedPasswordAt prop for the user. */
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();


  createAndSendToken(res, 201, `success`, user,
    { user: user },
    `The password was reset successfully!`);
});

exports.updatePassword = catchAsync(async function(req, res, next) {
  const { oldPassword, newPassword } = req.body;
  const id = req.user._id;
  // console.log(`Executing req.user:`, req.user);

  if (!oldPassword || !newPassword) {
    return next(new AppError(`Invalid request! The password is not specified!`, 400));
  }

  // 3. If verified, check if the user still exists,
  // console.log(decodedToken);
  /* 1. Get User from a collection */
  const user = await User.findById(id).select(`+password`);

  if (!user) {
    return next(new AppError(`User does not exist!`, 404));
  }
  // console.log(`Executing user: `, user);

  /* 2. Check if POSTed current password is correct */

  // create a mongoose custom method to check if user's old password
  // coming from post is the same as the pass in a db.
  // if true, return true, if false, return false.
  const passwordsMatch = await user.passwordsMatch(oldPassword, user.password);
  // console.log(`Executing passwordsMatch: `, passwordsMatch);

  if (!passwordsMatch) {
    return next(new AppError(`Failed! Incorrect old password!`, 401));
  }

  /* If so, update the pass */
  user.password = newPassword;
  user.confirmPassword = user.password;
  await user.save();

  createAndSendToken(res, 201, `success`, user, { user: user }, `The password was successfully changed!`);
});

// Only for rendered pages. There would be no errors
exports.isLoggedIn = async function(req, res, next) {
  try {
    // If we use JWTs here, then each authenticated user would have a JWT token
    // assigned to each request. We can easily extract it via headers and authentication key
    if (req.cookies.jwt) {

      // 2. Verify token
      const decodedToken = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

      // 3. If verified, check if the user still exists,
      // console.log(decodedToken);

      // connecting to a mongodb database and checking if user still exists.
      const user = await User.findById(decodedToken.id);

      if (!user) {
        return next();
      }

      // 4. Check if the user changed the password before after JWT was generated
      if (user.changedPasswordAfter(decodedToken.iat)) {
        return next();
      }

      // this would grant us access to the auth user data
      // thus next middleware controllers in a middleware stack would be able to use this data
      // That's the trick. Each time user logs in, we have access to "locals" variable in PUG TEMPLATE
      res.locals.user = user;

      // next effectively grants access to a protected resource.
      return next();
    }
    next();
  } catch (e) {
    return next();
  }

};


