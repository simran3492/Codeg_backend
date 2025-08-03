// config/nodemailer.js (Updated for Gmail)

const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a transporter object using Gmail's SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // `secure:true` is required for port 465
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address from .env file
    pass: process.env.EMAIL_PASS, // Your App Password from .env file
  },
});

module.exports = transporter;