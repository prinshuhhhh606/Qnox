const express = require('express');
const router = express.Router();
const { createInquiry, getAllInquiries } = require('../controllers/inquiryController');

router.route('/')
  .post(createInquiry)
  .get(getAllInquiries);

module.exports = router;
