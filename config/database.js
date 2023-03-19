const mongoose = require('mongoose');

// Set up default Mongoose connection
const mongoDB = 'mongodb://localhost/invoice_app';
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });

// Get the default Mongoose connection
const db = mongoose.connection;

// Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

module.exports = db;
