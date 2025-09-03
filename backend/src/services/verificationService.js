const axios = require('axios');
const { validateColombianId } = require('../utils/encryption');

// Servicio mock para verificación (en producción usarías Truora/MetaMap)
class VerificationService {
  constructor() {
    this.apiKey = process.env.KYC_API_KEY;
    this.baseURL = process.env.KYC_API_URL || 'https://api.truora.com/v1';
  }

  // Validar cédula contra base de datos oficial (mock)
  async validateIdentity(documentNumber, firstName, lastName) {
    try {
      // Validación básica del formato
      const validation = validateColombianId(documentNumber);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      // Simular llamada a API de verificación
      if (process.env.NODE_ENV === 'test') {
        // En testing, siempre retorna éxito
        return this.mockVerificationSuccess(documentNumber, firstName, lastName);
      }

      if (this.apiKey && this.baseURL) {
        // Integración real con Truora (ejemplo)
        return await this.realKYCCheck(documentNumber, firstName, lastName);
      } else {
        // Fallback a verificación mock
        return this.mockVerification(documentNumber, firstName, lastName);
      }
    } catch (error) {
      console.error('Error en verificación:', error);
      throw new Error(`Error en verificación: ${error.message}`);
    }
  }

  // Verificación mock para desarrollo
  async mockVerification(documentNumber, firstName, lastName) {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 80% de éxito, 20% de fallo para testing
    const isSuccess = Math.random() > 0.2;
    
    if (isSuccess) {
      return this.mockVerificationSuccess(documentNumber, firstName, lastName);
    } else {
      return this.mockVerificationFailure(documentNumber);
    }
  }

  mockVerificationSuccess(documentNumber, firstName, lastName) {
    return {
      success: true,
      data: {
        documentNumber,
        firstName,
        lastName,
        status: 'verified',
        score: 0.95,
        verificationDate: new Date(),
        details: {
          databaseMatch: true,
          biometricMatch: null, // Se completará con selfie
          riskLevel: 'low'
        }
      }
    };
  }

  mockVerificationFailure(documentNumber) {
    return {
      success: false,
      error: {
        code: 'VERIFICATION_FAILED',
        message: 'La verificación no pudo ser completada',
        details: {
          suggestion: 'Por favor verifica que los datos coincidan con tu documento oficial'
        }
      }
    };
  }

  // Integración real con Truora (ejemplo)
  async realKYCCheck(documentNumber, firstName, lastName) {
    try {
      const response = await axios.post(`${this.baseURL}/checks`, {
        document: {
          number: documentNumber,
          type: 'national-id',
          country: 'CO'
        },
        person: {
          first_name: firstName,
          last_name: lastName
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: response.data.status === 'success',
        data: response.data
      };
    } catch (error) {
      console.error('Error en API KYC:', error.response?.data || error.message);
      throw new Error('Error al conectar con el servicio de verificación');
    }
  }

  // Generar y enviar OTP
  async generateOTP(userId, email, phone) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // En producción, aquí enviarías el OTP por email/SMS
    console.log(`OTP para ${userId}: ${otp} (Expira: ${expiresAt})`);
    
    if (process.env.NODE_ENV !== 'production') {
      // En desarrollo, log el OTP para testing
      console.log(`📱 OTP de desarrollo: ${otp}`);
    }

    return {
      otp,
      expiresAt,
      sentTo: email || phone
    };
  }

  // Validar OTP
  validateOTP(inputOTP, storedOTP, expiresAt) {
    if (new Date() > expiresAt) {
      return { isValid: false, message: 'OTP expirado' };
    }
    
    if (inputOTP !== storedOTP) {
      return { isValid: false, message: 'OTP incorrecto' };
    }
    
    return { isValid: true, message: 'OTP válido' };
  }
}

module.exports = new VerificationService();