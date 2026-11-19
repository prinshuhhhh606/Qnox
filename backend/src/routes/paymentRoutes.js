const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getMyPayments,
  getAllPayments,
  getInvoice,
  initiateRefund,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middlewares/auth');

router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/my-payments', protect, getMyPayments);
router.get('/all', protect, authorize('Admin', 'Super Admin'), getAllPayments);
router.get('/invoice/:invoiceNumber', protect, getInvoice);
router.post('/:id/refund', protect, authorize('Admin', 'Super Admin'), initiateRefund);

module.exports = router;
