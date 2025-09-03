const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const { authenticate, requireVerification } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de verificación
router.post('/start', verificationController.startVerification);
router.post('/verify-otp', verificationController.verifyOTP);
router.post('/upload-documents', verificationController.uploadDocuments);
router.get('/status', verificationController.getVerificationStatus);
router.post('/retry', verificationController.retryVerification);

module.exports = router;