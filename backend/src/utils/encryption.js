const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Configuración
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// Generar clave de encriptación desde una semilla
function deriveKeyFromSecret(secret, salt) {
    return crypto.pbkdf2Sync(secret, salt, 100000, KEY_LENGTH, 'sha512');
}

// Encriptar datos
function encryptData(text, secret) {
    try {
        const salt = crypto.randomBytes(SALT_LENGTH);
        const key = deriveKeyFromSecret(secret, salt);
        const iv = crypto.randomBytes(IV_LENGTH);
        
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const tag = cipher.getAuthTag();
        
        // Combinar salt, iv, tag y datos encriptados
        const encryptedData = Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')]);
        
        return encryptedData.toString('base64');
    } catch (error) {
        console.error('Error en encriptación:', error);
        throw new Error('Error al encriptar los datos');
    }
}

// Desencriptar datos
function decryptData(encryptedData, secret) {
    try {
        const dataBuffer = Buffer.from(encryptedData, 'base64');
        
        // Extraer componentes
        const salt = dataBuffer.subarray(0, SALT_LENGTH);
        const iv = dataBuffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const tag = dataBuffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
        const encryptedText = dataBuffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
        
        const key = deriveKeyFromSecret(secret, salt);
        
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);
        
        let decrypted = decipher.update(encryptedText, null, 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error('Error en desencriptación:', error);
        throw new Error('Error al desencriptar los datos');
    }
}

// Generar hash seguro para documentos (irreversible)
function generateDocumentHash(documentNumber) {
  if (!documentNumber) {
    throw new Error('Número de documento requerido para generar hash');
  }
  
  // Usar bcrypt para hashing seguro
  const salt = bcrypt.genSaltSync(12);
  return bcrypt.hashSync(documentNumber.toString(), salt);
}

// Verificar hash de documento
function verifyDocumentHash(documentNumber, hash) {
    if (!documentNumber || !hash) {
        return false;
    }
    
    return bcrypt.compareSync(documentNumber.toString(), hash);
}

// Generar token seguro
function generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

// Hash de contraseña
async function hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
}

// Verificar contraseña
async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

// Generar código OTP seguro
function generateOTP(length = 6) {
    const digits = '0123456789';
    let OTP = '';
    
    for (let i = 0; i < length; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    
    return OTP;
}

module.exports = {
    encryptData,
    decryptData,
    generateDocumentHash,
    verifyDocumentHash,
    generateSecureToken,
    hashPassword,
    verifyPassword,
    generateOTP
};