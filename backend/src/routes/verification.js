const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const { authenticate } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de verificación
router.post('/start', verificationController.startVerification);
// ELIMINADA: router.post('/verify-otp', verificationController.verifyOTP);
router.get('/status', verificationController.getVerificationStatus);

module.exports = router;