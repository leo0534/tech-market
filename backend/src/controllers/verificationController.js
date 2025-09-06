const { Verification, User } = require('../models');
const { encryptData, generateDocumentHash } = require('../utils/encryption');
const verificationService = require('../services/verificationService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/verification';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user._id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'), false);
    }
  }
});

const verificationController = {
  // Iniciar proceso de verificación con imágenes
  startVerification: async (req, res) => {
    try {
      // Usar multer para manejar la subida de archivos
      upload.fields([
        { name: 'frontImage', maxCount: 1 },
        { name: 'backImage', maxCount: 1 }
      ])(req, res, async function (err) {
        if (err) {
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }

        const { documentType = 'cedula_colombiana' } = req.body;
        const userId = req.user._id;

        if (!req.files || !req.files.frontImage || !req.files.backImage) {
          return res.status(400).json({
            success: false,
            message: 'Debes subir ambas imágenes (frontal y posterior)'
          });
        }

        // Verificar si ya existe una verificación para este usuario
        const existingVerification = await Verification.findOne({
          userId,
          status: { $in: ['pending', 'approved', 'pending_review'] }
        });

        if (existingVerification) {
          // Eliminar imágenes subidas
          if (req.files.frontImage) fs.unlinkSync(req.files.frontImage[0].path);
          if (req.files.backImage) fs.unlinkSync(req.files.backImage[0].path);
          
          return res.status(400).json({
            success: false,
            message: 'Ya tienes una verificación en proceso o aprobada'
          });
        }

        // Obtener usuario
        const user = await User.findById(userId);
        if (!user) {
          if (req.files.frontImage) fs.unlinkSync(req.files.frontImage[0].path);
          if (req.files.backImage) fs.unlinkSync(req.files.backImage[0].path);
          return res.status(404).json({
            success: false,
            message: 'Usuario no encontrado'
          });
        }

        // Procesar imágenes con OCR
        try {
          const ocrResult = await verificationService.processDocumentOCR(
            req.files.frontImage[0].path,
            req.files.backImage[0].path
          );

          if (!ocrResult.success) {
            // Eliminar imágenes si falla el OCR
            if (req.files.frontImage) fs.unlinkSync(req.files.frontImage[0].path);
            if (req.files.backImage) fs.unlinkSync(req.files.backImage[0].path);
            
            return res.status(400).json({
              success: false,
              message: ocrResult.error || 'Error al procesar el documento'
            });
          }

          const { documentNumber, firstName, lastName, issueDate } = ocrResult.data;

          // Validar formato de cédula usando el método del servicio
          const validation = verificationService.validateColombianId(documentNumber);
          if (!validation.isValid) {
            if (req.files.frontImage) fs.unlinkSync(req.files.frontImage[0].path);
            if (req.files.backImage) fs.unlinkSync(req.files.backImage[0].path);
            
            return res.status(400).json({
              success: false,
              message: validation.message
            });
          }

          // NUEVO: Validar que los datos extraídos coincidan con el usuario
          const userDataValidation = verificationService.validateUserData(
            { firstName, lastName },
            { firstName: user.firstName, lastName: user.lastName }
          );

          if (!userDataValidation.isValid) {
            if (req.files.frontImage) fs.unlinkSync(req.files.frontImage[0].path);
            if (req.files.backImage) fs.unlinkSync(req.files.backImage[0].path);
            
            return res.status(400).json({
              success: false,
              message: userDataValidation.message,
              errorType: 'data_mismatch',
              extractedData: { firstName, lastName },
              userData: { 
                firstName: user.firstName, 
                lastName: user.lastName 
              }
            });
          }

          // Generar hash del documento
          const documentHash = generateDocumentHash(documentNumber);

          // Verificar si esta cédula ya está verificada
          const duplicateVerification = await Verification.findOne({
            documentHash,
            status: 'approved'
          });

          if (duplicateVerification) {
            if (req.files.frontImage) fs.unlinkSync(req.files.frontImage[0].path);
            if (req.files.backImage) fs.unlinkSync(req.files.backImage[0].path);
            
            return res.status(409).json({
              success: false,
              message: 'Este documento ya está verificado con otra cuenta'
            });
          }

          // Comparar datos extraídos con datos del usuario
          const nameSimilarity = verificationService.compareNames(
            { firstName, lastName },
            { firstName: user.firstName, lastName: user.lastName }
          );

          console.log(`Similitud de nombres: ${nameSimilarity * 100}%`);

          // Crear registro de verificación
          const verification = new Verification({
            userId,
            documentType,
            documentNumber,
            documentHash,
            frontImage: req.files.frontImage[0].path,
            backImage: req.files.backImage[0].path,
            extractedData: {
              firstName,
              lastName,
              documentNumber,
              issueDate: issueDate ? new Date(issueDate) : null,
              confidence: ocrResult.confidence
            },
            verificationMethod: 'ocr'
          });

          // VERIFICACIÓN AUTOMÁTICA SIN OTP
          if (nameSimilarity >= 0.7) { // 70% de similitud mínima
            // Similitud alta - VERIFICACIÓN AUTOMÁTICA
            verification.status = 'approved';
            verification.verificationDate = new Date();
            await verification.save();

            // Actualizar usuario como verificado
            await User.findByIdAndUpdate(userId, {
              isVerified: true,
              verificationStatus: 'verified',
              role: 'verified',
              documentNumber: documentNumber
            });

            return res.json({
              success: true,
              message: '¡Verificación completada exitosamente!',
              data: {
                verificationId: verification._id,
                status: 'approved',
                verified: true,
                similarity: nameSimilarity
              }
            });

          } else {
            // Similitud baja - requiere revisión
            verification.status = 'pending_review';
            await verification.save();

            return res.json({
              success: true,
              message: 'Documento recibido. Los nombres no coinciden completamente y requiere revisión manual.',
              data: {
                verificationId: verification._id,
                status: 'pending_review',
                similarity: nameSimilarity,
                extractedData: verification.extractedData
              }
            });
          }

        } catch (error) {
          // Eliminar imágenes en caso de error
          if (req.files.frontImage) fs.unlinkSync(req.files.frontImage[0].path);
          if (req.files.backImage) fs.unlinkSync(req.files.backImage[0].path);
          
          console.error('Error en procesamiento OCR:', error);
          res.status(500).json({
            success: false,
            message: 'Error al procesar el documento: ' + error.message
          });
        }
      });

    } catch (error) {
      console.error('Error en startVerification:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  

  // Obtener estado de verificación
  getVerificationStatus: async (req, res) => {
    try {
      const userId = req.user._id;

      const verification = await Verification.findOne({ userId })
        .sort({ createdAt: -1 })
        .select('-documentNumber');

      if (!verification) {
        return res.json({
          success: true,
          data: {
            status: 'not_started',
            message: 'Verificación no iniciada'
          }
        });
      }

      res.json({
        success: true,
        data: {
          status: verification.status,
          verificationDate: verification.verificationDate,
          rejectionReason: verification.rejectionReason,
          attempts: verification.attempts,
          extractedData: verification.extractedData,
          createdAt: verification.createdAt
        }
      });

    } catch (error) {
      console.error('Error en getVerificationStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estado de verificación'
      });
    }
  },

  // Reintentar verificación
  retryVerification: async (req, res) => {
    try {
      const userId = req.user._id;

      // Buscar verificación rechazada
      const previousVerification = await Verification.findOne({
        userId,
        status: 'rejected'
      }).sort({ createdAt: -1 });

      if (!previousVerification) {
        return res.status(404).json({
          success: false,
          message: 'No hay verificaciones rechazadas para reintentar'
        });
      }

      // Crear nueva verificación
      const newVerification = new Verification({
        userId,
        documentType: previousVerification.documentType,
        documentNumber: previousVerification.documentNumber,
        documentHash: previousVerification.documentHash,
        status: 'pending',
        previousAttempt: previousVerification._id
      });

      await newVerification.save();

      res.json({
        success: true,
        message: 'Verificación reiniciada. Puedes comenzar el proceso nuevamente.',
        data: {
          verificationId: newVerification._id
        }
      });

    } catch (error) {
      console.error('Error en retryVerification:', error);
      res.status(500).json({
        success: false,
        message: 'Error al reintentar verificación'
      });
    }
  },

  // Endpoint para desarrollo: forzar verificación
  forceVerification: async (req, res) => {
    try {
      const userId = req.user._id;

      // Solo permitir en desarrollo
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          success: false,
          message: 'Esta función solo está disponible en desarrollo'
        });
      }

      // Marcar como verificado
      await User.findByIdAndUpdate(userId, {
        isVerified: true,
        verificationStatus: 'verified',
        role: 'verified'
      });

      // Actualizar cualquier verificación existente
      await Verification.findOneAndUpdate(
        { userId },
        { 
          status: 'approved', 
          verificationDate: new Date(),
          extractedData: {
            firstName: 'Usuario',
            lastName: 'Verificado',
            documentNumber: '123456789',
            confidence: 1.0
          }
        },
        { upsert: true }
      );

      res.json({
        success: true,
        message: 'Usuario verificado manualmente para testing',
        data: {
          verified: true,
          verificationDate: new Date()
        }
      });

    } catch (error) {
      console.error('Error en forceVerification:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
};

module.exports = verificationController;