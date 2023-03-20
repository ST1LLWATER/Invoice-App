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
        $lookup: {
          from: 'accounts',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customer',
        },
      },
      {
        $unwind: '$customer',
      },
      {
        $addFields: {
          totalAmountStr: {
            $toString: '$totalAmount',
          },
        },
      },
      {
        $match: {
          $or: [
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
        $project: {
          totalAmountStr: 0,
          customer: 0,
        },
      },
    ];

    let invoices = await Invoice.aggregate(searchQuery)
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    await Invoice.populate(invoices, {
      path: 'customerId',
      select: { name: 1 },
    });

    res.json(invoices);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error', err });
  }
};
