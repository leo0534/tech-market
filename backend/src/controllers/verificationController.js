const { Verification, User } = require('../models');
const { encryptData, generateDocumentHash } = require('../utils/encryption');

const verificationController = {
  // Iniciar proceso de verificación
  startVerification: async (req, res) => {
    try {
      const { documentNumber, documentType = 'cedula_colombiana' } = req.body;
      const userId = req.user._id;

      // Verificar si ya existe una verificación para este usuario
      const existingVerification = await Verification.findOne({
        userId,
        status: { $in: ['pending', 'approved', 'pending_otp'] }
      });

      if (existingVerification) {
        return res.status(400).json({
          success: false,
          message: 'Ya tienes una verificación en proceso o aprobada'
        });
      }

      // Validar formato de cédula
      const { validateColombianId } = require('../utils/encryption');
      const validation = validateColombianId(documentNumber);
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.message
        });
      }

      // Generar hash del documento
      const documentHash = generateDocumentHash(documentNumber);

      // Verificar si esta cédula ya está verificada por otro usuario
      const duplicateVerification = await Verification.findOne({
        documentHash,
        status: 'approved'
      });

      if (duplicateVerification) {
        return res.status(409).json({
          success: false,
          message: 'Este documento ya está verificado con otra cuenta'
        });
      }

      // Crear registro de verificación
      const verification = new Verification({
        userId,
        documentType,
        documentNumber,
        documentHash,
        status: 'pending',
        attempts: 0
      });

      await verification.save();

      // Modo testing: Saltar verificación KYC y ir directo a OTP
      if (process.env.NODE_ENV === 'test') {
        verification.status = 'pending_otp';
        await verification.save();

        const verificationService = require('../services/verificationService');
        const user = await User.findById(userId);
        const otpInfo = await verificationService.generateOTP(
          userId,
          user.email,
          user.phone
        );

        verification.otpCode = otpInfo.otp;
        verification.otpExpires = otpInfo.expiresAt;
        await verification.save();

        return res.json({
          success: true,
          message: 'Verificación iniciada exitosamente (modo testing).',
          data: {
            verificationId: verification._id,
            nextStep: 'verify_otp',
            otpSentTo: otpInfo.sentTo,
            devOtp: otpInfo.otp
          }
        });
      }

      // Modo producción/desarrollo: Verificación KYC normal
      const verificationService = require('../services/verificationService');
      const user = await User.findById(userId);
      
      const verificationResult = await verificationService.validateIdentity(
        documentNumber,
        user.firstName,
        user.lastName
      );

      if (!verificationResult.success) {
        verification.status = 'rejected';
        verification.rejectionReason = verificationResult.error?.message || 'Error en verificación';
        await verification.save();

        return res.status(400).json({
          success: false,
          message: verificationResult.error?.message || 'Error en verificación',
          details: verificationResult.error?.details
        });
      }

      // Actualizar verificación con resultados
      if (verificationResult.data) {
        verification.encryptedData = encryptData(verificationResult.data);
      }
      verification.status = 'pending_otp';
      await verification.save();

      // Generar y enviar OTP
      const otpInfo = await verificationService.generateOTP(
        userId,
        user.email,
        user.phone
      );

      verification.otpCode = otpInfo.otp;
      verification.otpExpires = otpInfo.expiresAt;
      await verification.save();

      res.json({
        success: true,
        message: 'Verificación iniciada exitosamente. Se ha enviado un código OTP.',
        data: {
          verificationId: verification._id,
          nextStep: 'verify_otp',
          otpSentTo: otpInfo.sentTo,
          // En desarrollo, incluir OTP para testing
          ...(process.env.NODE_ENV !== 'production' && { devOtp: otpInfo.otp })
        }
      });

    } catch (error) {
      // Manejar error de duplicate key específicamente
      if (error.code === 11000 && error.keyPattern && error.keyPattern.documentHash) {
        return res.status(409).json({
          success: false,
          message: 'Este documento ya está en proceso de verificación'
        });
      }
      
      console.error('Error en startVerification:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor durante la verificación'
      });
    }
  },

  // Verificar OTP
  verifyOTP: async (req, res) => {
    try {
      const { verificationId, otpCode } = req.body;
      const userId = req.user._id;

      // Buscar verificación
      const verification = await Verification.findOne({
        _id: verificationId,
        userId,
        status: 'pending_otp'
      }).select('+otpCode +otpExpires');

      if (!verification) {
        return res.status(404).json({
          success: false,
          message: 'Verificación no encontrada o ya completada'
        });
      }

      // Validar OTP
      const verificationService = require('../services/verificationService');
      const otpValidation = verificationService.validateOTP(
        otpCode,
        verification.otpCode,
        verification.otpExpires
      );

      if (!otpValidation.isValid) {
        verification.attempts += 1;
        
        if (verification.attempts >= 3) {
          verification.status = 'rejected';
          verification.rejectionReason = 'Demasiados intentos OTP fallidos';
        }
        
        await verification.save();

        return res.status(400).json({
          success: false,
          message: otpValidation.message,
          attempts: verification.attempts,
          maxAttempts: 3
        });
      }

      // OTP válido - Completar verificación
      verification.status = 'approved';
      verification.verificationDate = new Date();
      verification.otpCode = undefined;
      verification.otpExpires = undefined;
      await verification.save();

      // Actualizar usuario como verificado
      await User.findByIdAndUpdate(userId, {
        isVerified: true,
        verificationStatus: 'verified',
        role: 'verified'
      });

      res.json({
        success: true,
        message: '¡Verificación completada exitosamente!',
        data: {
          verified: true,
          verificationDate: verification.verificationDate
        }
      });

    } catch (error) {
      console.error('Error en verifyOTP:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor durante la verificación OTP'
      });
    }
  },

  // Subir selfie y documento
  uploadDocuments: async (req, res) => {
    try {
      const { verificationId } = req.body;
      const userId = req.user._id;
      
      const verification = await Verification.findOne({
        _id: verificationId,
        userId
      });

      if (!verification) {
        return res.status(404).json({
          success: false,
          message: 'Verificación no encontrada'
        });
      }

      // Simular URLs de archivos subidos
      verification.selfieImage = `/uploads/selfies/${userId}_selfie.jpg`;
      verification.documentImage = `/uploads/documents/${userId}_document.jpg`;
      await verification.save();

      res.json({
        success: true,
        message: 'Documentos subidos exitosamente',
        data: {
          selfieUrl: verification.selfieImage,
          documentUrl: verification.documentImage
        }
      });

    } catch (error) {
      console.error('Error en uploadDocuments:', error);
      res.status(500).json({
        success: false,
        message: 'Error al subir documentos'
      });
    }
  },

  // Obtener estado de verificación
  getVerificationStatus: async (req, res) => {
    try {
      const userId = req.user._id;

      const verification = await Verification.findOne({ userId })
        .sort({ createdAt: -1 })
        .select('-otpCode -otpExpires -documentNumber');

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
          attempts: verification.attempts
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
  }
};

module.exports = verificationController;