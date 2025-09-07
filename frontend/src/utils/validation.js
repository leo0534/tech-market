import DOMPurify from 'dompurify';

// Validación MEJORADA para cédulas colombianas
export const validateCedula = (cedula) => {
  if (!cedula) return false;
  
  // Limpiar caracteres no numéricos
  const cleanCedula = cedula.replace(/\D/g, '');
  
  // Validar longitud (6-10 dígitos para Colombia)
  if (cleanCedula.length < 6 || cleanCedula.length > 10) {
    return false;
  }
  
  // Validar que no sean todos los mismos dígitos
  if (/^(\d)\1+$/.test(cleanCedula)) {
    return false;
  }
  
  return true;
};

export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 8; // Aumentado a 8 caracteres
};

export const validateName = (name) => {
  if (!name || name.length < 2) return false;
  
  // Validar que contenga solo letras y espacios
  const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
  if (!regex.test(name)) return false;
  
  // Validar que no sean solo espacios
  if (name.trim().length < 2) return false;
  
  return true;
};

export const sanitizeInput = (input) => {
  return DOMPurify.sanitize(input.trim());
};

export const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP'
  }).format(price);
};

// Validación específica para formulario de verificación
export const validateVerificationForm = (formData) => {
  const errors = {};
  
  if (!formData.frontImage) {
    errors.frontImage = 'La imagen frontal es requerida';
  }
  
  if (!formData.documentNumber) {
    errors.documentNumber = 'El número de documento es requerido';
  } else if (!validateCedula(formData.documentNumber)) {
    errors.documentNumber = 'El número de documento no es válido';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export default {
  validateCedula,
  validateEmail,
  validatePassword,
  validateName,
  sanitizeInput,
  formatPrice,
  validateVerificationForm
};