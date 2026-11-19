const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const { uploadSingleImage } = require('../controllers/uploadController');
const { protect, authorize } = require('../middlewares/auth');

router.post('/', protect, authorize('Admin', 'Super Admin'), upload.single('image'), uploadSingleImage);

module.exports = router;
