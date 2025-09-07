const { Verification, User } = require('../models');
const { encryptData, generateDocumentHash } = require('../utils/encryption');
const verificationService = require('../services/verificationService');
const path = require('path');
const fs = require('fs');
const { validateCedula } = require('../utils/validation');

// Función para guardar imagen en disco
const saveImage = (buffer, userId, suffix) => {
  const uploadDir = 'uploads/verification';
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const filename = `${userId}-${Date.now()}-${suffix}.jpg`;
  const filepath = path.join(uploadDir, filename);
  
  fs.writeFileSync(filepath, buffer);
  return filepath;
};

// Función para limpiar archivos temporales
const cleanupTempFiles = (filePaths) => {
  filePaths.forEach(filePath => {
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log('🗑️ Archivo temporal eliminado:', filePath);
      } catch (error) {
        console.warn('⚠️ No se pudo eliminar archivo temporal:', filePath);
      }
    }
  });
};

const verificationController = {
  // Iniciar proceso de verificación con imágenes - VERSIÓN CORREGIDA
  startVerification: async (req, res) => {
  let frontImagePath = null;
  let backImagePath = null;

  try {
    console.log('📥 Solicitud de verificación recibida');
    console.log('📋 Campos del body:', req.body);
    console.log('📁 Archivos recibidos:', req.files);

    const { documentType = 'cedula_colombiana' } = req.body;
    const userId = req.user._id;

    // Validar que hay archivos
    if (!req.files || !req.files.frontImage) {
      return res.status(400).json({
        success: false,
        message: 'Debes subir al menos la imagen frontal del documento'
      });
    }

    // Verificar si ya existe una verificación
    const existingVerification = await Verification.findOne({
      userId,
      status: { $in: ['pending', 'approved', 'pending_review', 'processing'] }
    });

    if (existingVerification) {
      return res.status(400).json({
        success: false,
        message: 'Ya tienes una verificación en proceso. Espera a que se complete.',
        existingStatus: existingVerification.status
      });
    }

    // Obtener usuario
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Guardar imágenes en disco
    frontImagePath = saveImage(
      req.files.frontImage[0].buffer, 
      userId, 
      'front'
    );
    
    if (req.files.backImage && req.files.backImage[0]) {
      backImagePath = saveImage(
        req.files.backImage[0].buffer,
        userId,
        'back'
      );
    }

    // ✅ SOLUCIÓN: Usar hash temporal único para evitar error de duplicado
    const tempHash = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Crear registro de verificación
    const verification = new Verification({
      userId,
      documentType,
      status: 'processing',
      frontImage: frontImagePath,
      backImage: backImagePath || null,
      verificationMethod: 'enhanced_ocr',
      documentHash: tempHash // ✅ Hash temporal único
    });

    await verification.save({ validateBeforeSave: false });

    // Responder inmediatamente
    res.json({
      success: true,
      message: 'Proceso de verificación iniciado. Estamos analizando tu documento.',
      data: {
        verificationId: verification._id,
        status: 'processing',
        async: true,
        estimatedTime: '10-30 segundos'
      }
    });

    // PROCESAMIENTO EN SEGUNDO PLANO
    setTimeout(async () => {
      try {
        console.log('🔄 Procesando documento en segundo plano...');
        
        // Procesar imágenes con OCR
        const ocrResult = await verificationService.processDocumentOCR(
          frontImagePath,
          backImagePath
        );

        if (!ocrResult.success) {
          throw new Error(ocrResult.error || 'Error al procesar el documento');
        }

        const { documentNumber, firstName, lastName } = ocrResult.data;

        // Validar formato de cédula
        const validation = validateCedula(documentNumber);
        if (!validation.isValid) {
          throw new Error(validation.message);
        }

        // Validar coincidencia de datos
        const userDataValidation = verificationService.validateUserData(
          { firstName, lastName },
          { firstName: user.firstName, lastName: user.lastName }
        );

        if (!userDataValidation.isValid) {
          throw new Error(userDataValidation.message);
        }

        // Generar hash REAL del documento
        const documentHash = generateDocumentHash(documentNumber);

        // Verificar duplicados con el hash REAL
        const duplicateVerification = await Verification.findOne({
          documentHash,
          status: 'approved',
          userId: { $ne: userId }
        });

        if (duplicateVerification) {
          throw new Error('Este documento ya está verificado con otra cuenta');
        }

        // Actualizar con datos REALES
        const updateData = {
          documentNumber: documentNumber,
          documentHash: documentHash, // ✅ Hash real
          extractedData: {
            firstName: firstName,
            lastName: lastName,
            documentNumber: documentNumber,
            confidence: ocrResult.confidence
          }
        };

        // Lógica de decisión de verificación...
        if (userDataValidation.similarity >= 0.7) {
          updateData.status = 'approved';
          updateData.verificationDate = new Date();
          await User.findByIdAndUpdate(userId, {
            isVerified: true,
            verificationStatus: 'verified',
            role: 'verified',
            documentNumber: documentNumber
          });
        } else if (userDataValidation.similarity >= 0.5) {
          updateData.status = 'pending_review';
          updateData.reviewReason = 'Similitud media. Requiere revisión manual.';
        } else {
          updateData.status = 'rejected';
          updateData.rejectionReason = 'Los datos no coinciden suficientemente.';
        }

        // ✅ Actualizar con hash real
        await Verification.findByIdAndUpdate(
          verification._id,
          updateData,
          { validateBeforeSave: false, runValidators: false }
        );

      } catch (error) {
        console.error('❌ Error en procesamiento:', error);
        
        // ✅ En caso de error, mantener el hash temporal pero marcar como rechazado
        await Verification.findByIdAndUpdate(
          verification._id,
          {
            status: 'rejected',
            rejectionReason: error.message,
            errorDetails: error.cause || {}
            // ✅ NO cambiar documentHash para mantener la unicidad
          },
          { validateBeforeSave: false, runValidators: false }
        );

        cleanupTempFiles([frontImagePath, backImagePath]);
      }
    }, 1000);

  } catch (error) {
    console.error('❌ Error en startVerification:', error);
    cleanupTempFiles([frontImagePath, backImagePath]);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar el proceso de verificación: ' + error.message
    });
  }
},

  // Obtener estado de verificación
  getVerificationStatus: async (req, res) => {
    try {
      const userId = req.user._id;

      // Buscar la última verificación del usuario
      const verification = await Verification.findOne({ userId })
        .sort({ createdAt: -1 })
        .select('-documentNumber -documentHash');

      if (!verification) {
        return res.json({
          success: true,
          data: {
            status: 'not_started',
            message: 'Verificación no iniciada'
          }
        });
      }

      // Formatear respuesta
      let message = '';
      switch (verification.status) {
        case 'processing':
          message = 'Tu documento está siendo procesado';
          break;
        case 'pending_review':
          message = 'Tu documento está en revisión manual';
          break;
        case 'approved':
          message = '¡Verificación exitosa!';
          break;
        case 'rejected':
          message = verification.rejectionReason || 'Verificación rechazada';
          break;
        default:
          message = `Estado: ${verification.status}`;
      }

      res.json({
        success: true,
        data: {
          status: verification.status,
          message: message,
          verificationDate: verification.verificationDate,
          rejectionReason: verification.rejectionReason,
          reviewReason: verification.reviewReason,
          extractedData: verification.extractedData,
          createdAt: verification.createdAt,
          updatedAt: verification.updatedAt
        }
      });

    } catch (error) {
      console.error('❌ Error en getVerificationStatus:', error);
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

      // Buscar verificación rechazada o expirada
      const previousVerification = await Verification.findOne({
        userId,
        status: { $in: ['rejected', 'expired'] }
      }).sort({ createdAt: -1 });

      if (!previousVerification) {
        return res.status(404).json({
          success: false,
          message: 'No hay verificaciones previas que se puedan reintentar'
        });
      }

      // Verificar que no haya otra verificación en proceso
      const existingVerification = await Verification.findOne({
        userId,
        status: { $in: ['pending', 'processing', 'pending_review'] }
      });

      if (existingVerification) {
        return res.status(400).json({
          success: false,
          message: 'Ya tienes una verificación en proceso. Espera a que se complete.',
          existingStatus: existingVerification.status
        });
      }

      // Crear nueva verificación
      const newVerification = new Verification({
        userId,
        documentType: previousVerification.documentType,
        previousAttempt: previousVerification._id,
        status: 'pending',
        documentHash: null
      });

      await newVerification.save({ validateBeforeSave: false });

      res.json({
        success: true,
        message: 'Verificación reiniciada. Ya puedes subir tus documentos nuevamente.',
        data: {
          verificationId: newVerification._id,
          previousStatus: previousVerification.status
        }
      });

    } catch (error) {
      console.error('❌ Error en retryVerification:', error);
      res.status(500).json({
        success: false,
        message: 'Error al reintentar verificación'
      });
    }
  },

  // Endpoint para administración: obtener todas las verificaciones pendientes de revisión
  getPendingReviews: async (req, res) => {
    try {
      // Solo para administradores
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Se requieren permisos de administrador.'
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const pendingVerifications = await Verification.find({
        status: 'pending_review'
      })
        .populate('userId', 'firstName lastName email')
        .select('-documentHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Verification.countDocuments({ status: 'pending_review' });

      res.json({
        success: true,
        data: {
          verifications: pendingVerifications,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      console.error('❌ Error en getPendingReviews:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener verificaciones pendientes'
      });
    }
  },

  // Endpoint para administración: aprobar/rechazar verificación manualmente
  reviewVerification: async (req, res) => {
    try {
      // Solo para administradores
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Se requieren permisos de administrador.'
        });
      }

      const { verificationId } = req.params;
      const { action, reason } = req.body;

      const verification = await Verification.findById(verificationId)
        .populate('userId');

      if (!verification) {
        return res.status(404).json({
          success: false,
          message: 'Verificación no encontrada'
        });
      }

      if (verification.status !== 'pending_review') {
        return res.status(400).json({
          success: false,
          message: 'Esta verificación no está pendiente de revisión'
        });
      }

      if (action === 'approve') {
        // Aprobar verificación
        verification.status = 'approved';
        verification.verificationDate = new Date();
        verification.reviewedBy = req.user._id;
        verification.reviewedAt = new Date();

        // Actualizar usuario
        await User.findByIdAndUpdate(verification.userId._id, {
          isVerified: true,
          verificationStatus: 'verified',
          role: 'verified',
          documentNumber: verification.documentNumber
        });

      } else if (action === 'reject') {
        // Rechazar verificación
        verification.status = 'rejected';
        verification.rejectionReason = reason || 'Rechazado por revisión manual';
        verification.reviewedBy = req.user._id;
        verification.reviewedAt = new Date();

      } else {
        return res.status(400).json({
          success: false,
          message: 'Acción no válida. Use "approve" o "reject".'
        });
      }

      await verification.save({ validateBeforeSave: false });

      res.json({
        success: true,
        message: `Verificación ${action === 'approve' ? 'aprobada' : 'rechazada'} exitosamente`,
        data: {
          status: verification.status,
          reviewedAt: verification.reviewedAt
        }
      });

    } catch (error) {
      console.error('❌ Error en reviewVerification:', error);
      res.status(500).json({
        success: false,
        message: 'Error al procesar la revisión'
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

      // Verificar si ya existe una verificación
      const existingVerification = await Verification.findOne({ userId });

      if (existingVerification && existingVerification.status === 'approved') {
        return res.status(400).json({
          success: false,
          message: 'El usuario ya está verificado'
        });
      }

      // Marcar como verificado
      await User.findByIdAndUpdate(userId, {
        isVerified: true,
        verificationStatus: 'verified',
        role: 'verified',
        documentNumber: '123456789'
      });

      // Actualizar o crear verificación
      const verificationData = {
        status: 'approved',
        verificationDate: new Date(),
        documentNumber: '123456789',
        documentHash: generateDocumentHash('123456789'),
        extractedData: {
          firstName: 'Usuario',
          lastName: 'Verificado',
          documentNumber: '123456789',
          confidence: 1.0
        },
        verificationMethod: 'forced'
      };

      if (existingVerification) {
        await Verification.findByIdAndUpdate(
          existingVerification._id,
          verificationData,
          { validateBeforeSave: false }
        );
      } else {
        await Verification.create({
          userId,
          documentType: 'cedula_colombiana',
          ...verificationData
        });
      }

      res.json({
        success: true,
        message: 'Usuario verificado manualmente para testing',
        data: {
          verified: true,
          verificationDate: new Date()
        }
      });

    } catch (error) {
      console.error('❌ Error en forceVerification:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Endpoint para limpiar verificaciones antiguas (mantenimiento)
  cleanupVerifications: async (req, res) => {
    try {
      // Solo para administradores
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Se requieren permisos de administrador.'
        });
      }

      const days = parseInt(req.query.days) || 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Eliminar verificaciones rechazadas/expiradas antiguas
      const result = await Verification.deleteMany({
        status: { $in: ['rejected', 'expired'] },
        createdAt: { $lt: cutoffDate }
      });

      // Eliminar archivos de imágenes asociados
      const oldVerifications = await Verification.find({
        status: { $in: ['rejected', 'expired'] },
        createdAt: { $lt: cutoffDate }
      });

      for (const verification of oldVerifications) {
        cleanupTempFiles([verification.frontImage, verification.backImage]);
      }

      res.json({
        success: true,
        message: `Limpieza completada. Eliminadas ${result.deletedCount} verificaciones antiguas.`,
        data: {
          deletedCount: result.deletedCount,
          cutoffDate: cutoffDate
        }
      });

    } catch (error) {
      console.error('❌ Error en cleanupVerifications:', error);
      res.status(500).json({
        success: false,
        message: 'Error al limpiar verificaciones antiguas'
      });
    }
  }
};

module.exports = verificationController;