function validateCedula(cedula) {
  if (!cedula) {
    return {
      isValid: false,
      message: 'Número de cédula no proporcionado'
    };
  }

  // Limpiar el número (remover puntos, espacios, etc.)
  const cleanCedula = cedula.toString().replace(/\D/g, '');
  
  // Validar longitud (8-10 dígitos para Colombia)
  if (cleanCedula.length < 8 || cleanCedula.length > 10) {
    return {
      isValid: false,
      message: `El número de cédula debe tener entre 8 y 10 dígitos. Se recibió: ${cleanCedula} (${cleanCedula.length} dígitos)`
    };
  }

  // Validar que sean solo números
  if (!/^\d+$/.test(cleanCedula)) {
    return {
      isValid: false,
      message: 'El número de cédula debe contener solo dígitos'
    };
  }

  return {
    isValid: true,
    message: 'Número de cédula válido'
  };
}

// Función de validación simple para testing
function validateCedulaSimple(cedula) {
  if (!cedula) {
    return {
      isValid: false,
      message: 'Número de cédula no proporcionado'
    };
  }

  const cleanCedula = cedula.toString().replace(/\D/g, '');
  
  // Validación mínima para testing
  if (cleanCedula.length >= 6) {
    return {
      isValid: true,
      message: 'Número de cédula válido (modo testing)'
    };
  }

  return {
    isValid: false,
    message: 'Número de cédula demasiado corto'
  };
}

// Validar nombres (similitud básica)
function validateNames(extractedName, userName, minSimilarity = 0.6) {
  if (!extractedName || !userName) {
    return {
      isValid: false,
      message: 'Nombres no proporcionados para validación'
    };
  }

  const normalize = (str) => {
    return str
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const normalizedExtracted = normalize(extractedName);
  const normalizedUser = normalize(userName);

  // Calcular similitud simple
  const wordsExtracted = new Set(normalizedExtracted.split(' '));
  const wordsUser = new Set(normalizedUser.split(' '));
  
  let matchCount = 0;
  for (const word of wordsExtracted) {
    if (word.length > 2 && wordsUser.has(word)) {
      matchCount++;
    }
  }

  const similarity = (2 * matchCount) / (wordsExtracted.size + wordsUser.size);
  
  return {
    isValid: similarity >= minSimilarity,
    similarity: similarity,
    message: similarity >= minSimilarity 
      ? 'Nombres coincidentes' 
      : `Los nombres no coinciden suficientemente (similitud: ${(similarity * 100).toFixed(1)}%)`
  };
}

module.exports = { 
  validateCedula,
  validateCedulaSimple,
  validateNames
};