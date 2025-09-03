const { User } = require('../models');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  saveRefreshToken,
  revokeRefreshToken,
  verifyRefreshToken
} = require('../utils/jwt');

// Registrar nuevo usuario
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, location } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Crear nuevo usuario
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      phone,
      location
    });

    await user.save();

    // Generar tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id, {
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    });

    // Guardar refresh token
    await saveRefreshToken(refreshToken, user._id, {
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    });

    // Configurar cookie para refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isVerified: user.isVerified,
          role: user.role
        },
        accessToken,
        expiresIn: '15m'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en el registro: ' + error.message
    });
  }
};

// Login de usuario
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario con password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Actualizar último login
    user.lastLogin = new Date();
    await user.save();

    // Generar tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id, {
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    });

    // Guardar refresh token
    await saveRefreshToken(refreshToken, user._id, {
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    });

    // Configurar cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isVerified: user.isVerified,
          role: user.role
        },
        accessToken,
        expiresIn: '15m'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en el login: ' + error.message
    });
  }
};

// Refresh token
const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token requerido'
      });
    }

    // Verificar refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Buscar token en la base de datos
    const storedToken = await RefreshToken.findOne({ 
      token: refreshToken, 
      isRevoked: false 
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token inválido o expirado'
      });
    }

    // Generar nuevo access token
    const accessToken = generateAccessToken(decoded.userId);

    res.json({
      success: true,
      message: 'Token refrescado exitosamente',
      data: {
        accessToken,
        expiresIn: '15m'
      }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
      // Revocar refresh token
      await revokeRefreshToken(refreshToken);
    }

    // Limpiar cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({
      success: true,
      message: 'Logout exitoso'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en el logout: ' + error.message
    });
  }
};

// Obtener perfil del usuario autenticado
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('location');

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil: ' + error.message
    });
  }
};

// Actualizar perfil
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, location } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, phone, location },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: { user }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil: ' + error.message
    });
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getProfile,
  updateProfile
};