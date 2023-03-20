const express = require('express');
const { createInvoice, listInvoice } = require('../controllers/invoice');
const router = express();

router.post('/createinvoice', createInvoice);
router.post('/invoicelist', listInvoice);

module.exports = router;
