const express = require('express');
const db = require('./config/database');

const accountRoutes = require('./routes/account');

const app = express();

const PORT = process.env.PORT || 3000;

// Set up middleware, routes, etc.
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api', accountRoutes);
// Start the server

// Connect to the database
db.once('open', () => {
  console.log('Connected to MongoDB database');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
