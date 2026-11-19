exports.uploadSingleImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No image file uploaded or file rejected by sanctuary format rules.',
    });
  }

  const relativeUrl = `/uploads/${req.file.filename}`;
  const fullUrl = `${req.protocol}://${req.get('host')}${relativeUrl}`;

  res.status(200).json({
    success: true,
    message: 'Image uploaded successfully to sanctuary storage.',
    data: {
      filename: req.file.filename,
      relativeUrl,
      url: fullUrl,
      size: req.file.size,
      mimetype: req.file.mimetype,
    },
  });
};
