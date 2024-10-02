const mongoose = require('mongoose');
const dotenv = require('dotenv');

// now, if any uncaught exception occurs, we terminate the machine
// without the code execution below.
process.on(`uncaughtException`, (err) => {
  console.log(`UNCAUGHT_EXCEPTION: SHUTTING THE MACHINE DOWN...`, err.message);
  console.log(`error.name`, err.name);
  console.log(`error.message`, err.message);
  process.exit(1);
});

const app = require('./app');

dotenv.config({
  path: `${__dirname}/config.env`
});

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true
}).then(() => {
  console.log('Mongo is successfully connected!');
});

const port = process.env.PORT;

const server = app.listen(port, '127.0.0.1', () => {
  console.log(`The server listens at ${port} port...`);
});

process.on(`unhandledRejection`, (error) => {
  console.log(error.name, error.message);
  console.log(`UNHANDLED REJECTION: SHUTTING THE MACHINE DOWN...`, error.message);
  // 1 means uncaught exception
  // 0 means everything is good
  // process.exit(1);

  // by closing the server like this, we give it time to finish all
  // the incoming requests, and only after that we gracefully shut it down.
  server.close(() => {
    process.exit(1);
  });
});
