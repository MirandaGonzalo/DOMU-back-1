const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_ACCOUNT,
    pass: process.env.EMAIL_PASS
  }
});

module.exports = transporter;