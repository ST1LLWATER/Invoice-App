const mongoose = require('mongoose');

const balanceSchema = new mongoose.Schema(
  {
    year: {
      type: String,
      required: true,
    },
    balance: {
      type: Number,
      required: true,
    },
  },
  {
    _id: false,
  }
);

const accountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  balances: {
    type: [balanceSchema],
    validate: [
      {
        validator: function (balances) {
          return balances.length === 3;
        },
        message:
          'You should provide three financial year balances from 2022 i.e 2022-23, 2023-24, 2024-25.',
      },
      {
        validator: function (balances) {
          const years = balances.map((b) => b.year);
          return (
            years.includes('2022-23') &&
            years.includes('2023-24') &&
            years.includes('2024-25')
          );
        },
        message: 'Balances must be for years 2022-23, 2023-24, or 2024-25.',
      },
    ],
  },
});

accountSchema.index({ name: 'text' });

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;
