const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// validate: [validator.isAlpha, `A title should only contain letters (a-z)!`]
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: [1, `The name should contain at least 1 character!`],
    maxlength: [100, `The name should be up to 100 characters!`],
    trim: true,
    required: [true, `The Name is required!`]
  },
  email: {
    type: String,
    trim: true,
    minlength: 3,
    validate: [validator.isEmail, `Please enter a valid email address!`],
    required: [true, `The Email is required!`],
    unique: true,
    lowercase: true
  },
  photo: {
    type: String,
    trim: true,
    default: `default.jpg`
  },
  role: {
    type: String,
    enum: [`admin`, `user`, `lead-guide`, `guide`],
    trim: true,
    default: `user`
  },
  password: {
    type: String,
    trim: true,
    minlength: [8, `The Password should be at least 8 characters!`],
    required: [true, `The Password is required!`],
    // makes the password not show up in ANY output
    select: false
  },
  confirmPassword: {
    type: String,
    trim: true,
    minlength: [8, `The Confirm Password should be at least 8 characters!`],
    required: [true, `Confirm password before trying to log in!`],
    /* IMPORTANT: THIS IS ONLY GONNA WORK ON "SAVE" AND "CREATE".
    *   WHEN WE UPDATE ANYTHING, THIS VALIDATION WON'T RUN*/
    validate: {
      validator: function(val) {
        return this.password === val;
      },
      message: `Passwords do not match!`
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

userSchema.pre(/^find/, async function(next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.pre(`save`, async function(next) {
  // if the password has not been modified, then just go to the next
  // middleware in a middleware stack
  if (!this.isModified(`password`)) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 12);
  // by setting any value in a db to undefined, this prop
  // won't be persistent in a collection
  this.confirmPassword = undefined;

  next();
});

userSchema.methods.passwordsMatch = async function(candidatePassword, userPassword) {
  // the "this.password" won't be accessible because we set the password to select: false
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString(`hex`);
  this.passwordResetToken = crypto
    .createHash(`sha256`)
    .update(resetToken)
    .digest(`hex`);

  // console.log(`Reset token: `, { resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};


userSchema.pre(`save`, function(next) {
  if (!this.isModified(`password`) || this.isNew) {
    return next();
  }
  // this ensures that the password, if modified,
  // always would have the date in the past
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

const User = mongoose.model(`users`, userSchema);

module.exports = User;

