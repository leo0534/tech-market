import DOMPurify from 'dompurify';

// Funciones puras sin process.env
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const validateCedula = (cedula) => {
  return /^\d{6,10}$/.test(cedula);
};

export const sanitizeInput = (input) => {
  return DOMPurify.sanitize(input);
};

export const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP'
  }).format(price);
};