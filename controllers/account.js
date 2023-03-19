const Account = require('../models/Account');

exports.createAccount = async (req, res) => {
  try {
    const account = new Account(req.body);

    await account.save();
    res.status(201).json({ account });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const validationErrors = Object.values(err.errors).map(
        (error) => error.message
      );

      return res.status(400).json({ error: validationErrors });
    }
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
