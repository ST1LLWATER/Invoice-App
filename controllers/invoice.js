const Invoice = require('../models/Invoice');

exports.createInvoice = async (req, res) => {
  try {
    const invoice = await new Invoice(req.body);

    await invoice.save();

    return res.status(201).json({ invoice });
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

exports.listInvoice = async (req, res) => {
  const { skip = 0, limit = 10, search = '' } = req.body;

  try {
    //Case handling for matching 100.00 with field with value 100 too.
    let searchAmount = parseInt(search);

    //Exception Case for when Search is like 100.50 and its parsed to 100
    if (parseFloat(searchAmount) !== parseFloat(search)) {
      //Parse Float on 100.50 making it 100.5 as MongoDB stores it as 100.50 as 100.5 in number field type
      searchAmount = parseFloat(search);
    }

    const searchQuery = [
      {
        $unwind: '$accountArray',
      },
      {
        $lookup: {
          from: 'accounts',
          localField: 'accountArray.accountId',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $unwind: '$customer',
      },
      {
        $addFields: {
          'accountArray.amountStr': {
            $toString: '$accountArray.amount',
          },
        },
      },
      {
        $addFields: {
          totalAmountStr: {
            $toString: '$totalAmount',
          },
        },
      },
      {
        $group: {
          _id: '$_id',
          customerId: { $first: '$customerId' },
          createdAt: { $first: 'createdAt' },
          customer: { $first: '$customer' },
          date: { $first: '$date' },
          accountArray: { $push: '$accountArray' },
          invoiceNumber: { $first: '$invoiceNumber' },
          totalAmount: { $first: '$totalAmount' },
          totalAmountStr: { $first: '$totalAmountStr' },
          year: { $first: '$year' },
        },
      },
      {
        $match: {
          $or: [
            {
              'accountArray.amountStr': {
                $regex: RegExp(`^${searchAmount}`),
              },
            },
            {
              totalAmountStr: {
                $regex: RegExp(`^${searchAmount}`),
              },
            },
            {
              invoiceNumber: `${search}`,
            },
            {
              'customer.name': {
                $regex: RegExp(`${search}`),
                $options: 'i',
              },
            },
          ],
        },
      },
      {
        $unwind: '$accountArray',
      },
      {
        $project: {
          'accountArray.amountStr': 0,
          customer: 0,
          totalAmountStr: 0,
        },
      },
      {
        $group: {
          _id: '$_id',
          customerId: { $first: '$customerId' },
          createdAt: { $first: 'createdAt' },
          date: { $first: '$date' },
          accountArray: { $push: '$accountArray' },
          invoiceNumber: { $first: '$invoiceNumber' },
          totalAmount: { $first: '$totalAmount' },
          year: { $first: '$year' },
        },
      },
    ];

    let invoices = await Invoice.aggregate(searchQuery)
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    await Invoice.populate(invoices, {
      path: 'accountArray.accountId',
      select: { name: 1 },
    });

    if (invoices.length === 0) {
      return res.status(404).json({ message: 'No invoices found' });
    }

    res.json(invoices);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error', err });
  }
};
