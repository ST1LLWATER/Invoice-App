const express = require('express');
const { createAccount } = require('../controllers/account');
const router = express();

router.post('/createaccount', createAccount);

module.exports = router;
