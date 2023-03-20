const mongoose = require('mongoose');

const accountArraySchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  {
    _id: false,
  }
);

const invoiceSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
      validate: [
        {
          validator: async function (customerId) {
            const account = await mongoose
              .model('Account')
              .findById(customerId);

            return !!account;
          },

          message: 'Specified customer does not exist. (Customer ID not found)',
        },
      ],
    },
    accountArray: {
      type: [accountArraySchema],
      validate: [
        {
          validator: function (accountArray) {
            return accountArray.length > 0;
          },
          message: 'Account array should have at least one data.',
        },
      ],
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    year: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Validation to check if accountId exists in DB
invoiceSchema
  .path('accountArray')
  .schema.path('accountId')
  .validate(
    async function (value) {
      const account = await mongoose.model('Account').findById(value);
      return !!account;
    },
    (props) =>
      `Account ID ${props.value} specified in account array does not exist. (Account ID not found)`
  );

// Validation to check if invoice number is unique for the same year
invoiceSchema.path('invoiceNumber').validate(async function (value) {
  const invoice = await mongoose
    .model('Invoice')
    .findOne({ invoiceNumber: value, year: this.year });
  return !invoice;
}, 'Invoice number already exists for the same year.');

// Validation to check if total of amount in accountArray is equal to totalAmount
invoiceSchema.pre('validate', function (next) {
  const totalAmount = this.accountArray.reduce(
    (acc, { amount }) => acc + amount,
    0
  );
  if (totalAmount !== this.totalAmount) {
    this.invalidate(
      'totalAmount',
      'Total of amount in accountArray should be equal to Total Amount Provided.'
    );
  }
  next();
});

// Increment balances of all accounts in accountArray for the concerned year after saving entry
invoiceSchema.post('save', async function () {
  for (const { accountId, amount } of this.accountArray) {
    const account = await mongoose.model('Account').findById(accountId);
    const balance = account.balances.find((b) => b.year === this.year);
    balance.balance += amount;
    await account.save();
  }
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
