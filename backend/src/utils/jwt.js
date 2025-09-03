const jwt = require('jsonwebtoken');
const { RefreshToken } = require('../models');

// Generar Access Token (15 minutos)
const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET, 
    { expiresIn: '15m' }
  );
};

// Generar Refresh Token (7 días)
const generateRefreshToken = (userId, deviceInfo = {}) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

// Verificar Access Token
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
};

// Verificar Refresh Token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Refresh token inválido o expirado');
  }
};

// Guardar Refresh Token en la base de datos
const saveRefreshToken = async (token, userId, deviceInfo = {}) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

  return await RefreshToken.create({
    token,
    userId,
    expiresAt,
    deviceInfo
  });
};

// Revocar Refresh Token
const revokeRefreshToken = async (token) => {
  return await RefreshToken.findOneAndUpdate(
    { token },
    { isRevoked: true, revokedAt: new Date() }
  );
};

// Obtener todos los tokens activos de un usuario
const getActiveTokens = async (userId) => {
  return await RefreshToken.find({
    userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  saveRefreshToken,
  revokeRefreshToken,
  getActiveTokens
};