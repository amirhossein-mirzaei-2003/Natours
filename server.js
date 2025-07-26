const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config({ path: `${__dirname}/config.env` });

process.on('uncaughtException', (err) => {
  console.log(err);
  console.log('UNCAUGHT EXCEPTION SHUTING DOWN...');

  process.exit(1);
});

const app = require('./app');
app.set('query parser', 'extended');

console.log(app.get('env'));

const DB = process.env.DATABASE.replace(
  '<db_password>',
  process.env.DATABASE_PASSWORD,
);
mongoose.connect(DB).then(() => console.log('connected to db successfuly'));

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`we are on port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log(err);
  console.log('UNHANDLED REJECTION SHUTING DOWN...');
  server.close(() => {
    process.exit(1);
  });
});
