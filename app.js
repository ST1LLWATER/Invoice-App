const express = require('express');
const db = require('./config/database');
require('dotenv').config();

const accountRoutes = require('./routes/account');
const invoiceRoutes = require('./routes/invoice');

const app = express();

console.log(process.env.DB_URL);

const PORT = process.env.PORT || 3000;

// Set up middleware, routes, etc.
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api', accountRoutes);
app.use('/api', invoiceRoutes);
// Start the server

// Connect to the database
db.once('open', () => {
  console.log('Connected to MongoDB database');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
