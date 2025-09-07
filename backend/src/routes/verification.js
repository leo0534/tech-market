const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload'); // ✅ Importar desde middleware

// Todas las rutas requieren autenticación
router.use(authenticate);

// Ruta para iniciar verificación - CON middleware multer
router.post('/start', 
  upload.fields([
    { name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 }
  ]),
  verificationController.startVerification
);

// Ruta para obtener estado
router.get('/status', verificationController.getVerificationStatus);

// Ruta para reintentar
router.post('/retry', verificationController.retryVerification);

// Rutas de administración
router.get('/admin/pending', verificationController.getPendingReviews);
router.post('/admin/review/:verificationId', verificationController.reviewVerification);
router.delete('/admin/cleanup', verificationController.cleanupVerifications);

// Ruta para desarrollo
router.post('/force', verificationController.forceVerification);

module.exports = router;