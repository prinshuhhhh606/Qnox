const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const { uploadSingleImage } = require('../controllers/uploadController');
const { protect, authorize } = require('../middlewares/auth');

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'QNOX Media & Image Storage Service',
    usage: 'Send POST request with multipart/form-data containing "image" file.',
    endpoint: '/api/upload',
  });
});

router.post('/', protect, authorize('Admin', 'Super Admin'), upload.single('image'), uploadSingleImage);

module.exports = router;
