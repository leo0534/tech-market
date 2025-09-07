// Validar cédula colombiana
function validateCedula(cedula) {
    if (!cedula) {
        return { isValid: false, reason: 'Número de documento requerido' };
    }

    // Limpiar caracteres no numéricos
    const cleanCedula = cedula.toString().replace(/\D/g, '');
    
    // Validar longitud (6-10 dígitos para Colombia)
    if (cleanCedula.length < 6 || cleanCedula.length > 10) {
        return { 
            isValid: false, 
            reason: `La cédula debe tener entre 6 y 10 dígitos. Longitud actual: ${cleanCedula.length}`,
            cleanedValue: cleanCedula
        };
    }

    // Validar que no sean todos los mismos dígitos
    if (/^(\d)\1+$/.test(cleanCedula)) {
        return { 
            isValid: false, 
            reason: 'Número de documento no válido (dígitos repetidos)',
            cleanedValue: cleanCedula
        };
    }

    // Validar que sea numérico
    if (!/^\d+$/.test(cleanCedula)) {
        return { 
            isValid: false, 
            reason: 'El número de documento solo debe contener dígitos',
            cleanedValue: cleanCedula
        };
    }
    
    // Validar que no sea un número obviamente falso
    const invalidNumbers = [
        '000000', '111111', '222222', '333333', '444444', 
        '555555', '666666', '777777', '888888', '999999',
        '123456', '654321', '012345', '543210'
    ];
    
    if (invalidNumbers.includes(cleanCedula)) {
        return {
            isValid: false,
            reason: 'Número de documento no válido',
            cleanedValue: cleanCedula
        };
    }

    return { 
        isValid: true, 
        cleanedValue: cleanCedula,
        length: cleanCedula.length
    };
}

// Validar email
function validateEmail(email) {
    if (!email) {
        return { isValid: false, reason: 'Email requerido' };
    }
    
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = regex.test(email);
    
    return {
        isValid,
        reason: isValid ? null : 'Formato de email no válido'
    };
}

// Validar contraseña
function validatePassword(password) {
    if (!password) {
        return { isValid: false, reason: 'Contraseña requerida' };
    }
    
    if (password.length < 8) {
        return {
            isValid: false,
            reason: 'La contraseña debe tener al menos 8 caracteres'
        };
    }
    
    // Al menos una mayúscula, una minúscula, un número y un carácter especial
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasUpperCase) {
        return {
            isValid: false,
            reason: 'La contraseña debe contener al menos una letra mayúscula'
        };
    }
    
    if (!hasLowerCase) {
        return {
            isValid: false,
            reason: 'La contraseña debe contener al menos una letra minúscula'
        };
    }
    
    if (!hasNumber) {
        return {
            isValid: false,
            reason: 'La contraseña debe contener al menos un número'
        };
    }
    
    if (!hasSpecialChar) {
        return {
            isValid: false,
            reason: 'La contraseña debe contener al menos un carácter especial (!@#$%^&*(),.?":{}|<>)'
        };
    }
    
    return { isValid: true, reason: null };
}

// Validar nombre
function validateName(name, fieldName = 'Nombre') {
    if (!name) {
        return { isValid: false, reason: `${fieldName} requerido` };
    }
    
    const trimmedName = name.trim();
    
    if (trimmedName.length < 2) {
        return {
            isValid: false,
            reason: `El ${fieldName.toLowerCase()} debe tener al menos 2 caracteres`
        };
    }
    
    if (trimmedName.length > 50) {
        return {
            isValid: false,
            reason: `El ${fieldName.toLowerCase()} no puede exceder los 50 caracteres`
        };
    }
    
    // Validar que contenga solo letras, espacios y caracteres especiales permitidos
    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s\-']+$/;
    if (!regex.test(trimmedName)) {
        return {
            isValid: false,
            reason: `El ${fieldName.toLowerCase()} solo puede contener letras, espacios, guiones y apóstrofes`
        };
    }
    
    return { isValid: true, reason: null };
}

// Limpiar y normalizar nombre
function cleanName(name) {
    if (!name) return '';
    
    return name
        .trim()
        .replace(/[^\w\sáéíóúñÁÉÍÓÚÑ]/gi, ' ') // Remover caracteres especiales
        .replace(/\s+/g, ' ') // Espacios múltiples a simple
        .toUpperCase();
}

// Validar datos de registro de usuario
function validateUserRegistration(userData) {
    const errors = [];
    
    // Validar nombre
    const firstNameValidation = validateName(userData.firstName, 'Nombre');
    if (!firstNameValidation.isValid) {
        errors.push({ field: 'firstName', message: firstNameValidation.reason });
    }
    
    // Validar apellido
    const lastNameValidation = validateName(userData.lastName, 'Apellido');
    if (!lastNameValidation.isValid) {
        errors.push({ field: 'lastName', message: lastNameValidation.reason });
    }
    
    // Validar email
    const emailValidation = validateEmail(userData.email);
    if (!emailValidation.isValid) {
        errors.push({ field: 'email', message: emailValidation.reason });
    }
    
    // Validar contraseña
    const passwordValidation = validatePassword(userData.password);
    if (!passwordValidation.isValid) {
        errors.push({ field: 'password', message: passwordValidation.reason });
    }
    
    // Validar teléfono (opcional)
    if (userData.phone && userData.phone.trim() !== '') {
        const phoneRegex = /^[\d\s\-\+\(\)]{7,20}$/;
        if (!phoneRegex.test(userData.phone)) {
            errors.push({ 
                field: 'phone', 
                message: 'El formato del teléfono no es válido. Debe tener entre 7 y 20 dígitos.' 
            });
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors.length > 0 ? errors : null,
        data: errors.length === 0 ? {
            firstName: cleanName(userData.firstName),
            lastName: cleanName(userData.lastName),
            email: userData.email.toLowerCase().trim(),
            password: userData.password,
            phone: userData.phone ? userData.phone.trim() : ''
        } : null
    };
}

// Validar datos de verificación de documento
function validateDocumentVerification(data) {
    const errors = [];
    
    // Validar tipo de documento
    const validDocumentTypes = ['cedula_colombiana', 'cedula_extranjeria', 'pasaporte'];
    if (!data.documentType || !validDocumentTypes.includes(data.documentType)) {
        errors.push({ 
            field: 'documentType', 
            message: 'Tipo de documento no válido. Opciones válidas: cedula_colombiana, cedula_extranjeria, pasaporte' 
        });
    }
    
    // Validar número de documento
    if (!data.documentNumber || data.documentNumber.trim() === '') {
        errors.push({ field: 'documentNumber', message: 'Número de documento requerido' });
    } else {
        const docRegex = /^[\d\.\-\s]{6,20}$/;
        if (!docRegex.test(data.documentNumber)) {
            errors.push({ 
                field: 'documentNumber', 
                message: 'El número de documento solo puede contener dígitos, puntos, guiones y espacios (6-20 caracteres)' 
            });
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors.length > 0 ? errors : null,
        data: errors.length === 0 ? {
            documentType: data.documentType,
            documentNumber: data.documentNumber.replace(/\D/g, '') // Solo números
        } : null
    };
}

// Validar formato de imagen
function validateImageFile(file) {
    if (!file) {
        return { isValid: false, reason: 'Archivo de imagen requerido' };
    }
    
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp'
    ];
    
    const maxSize = 8 * 1024 * 1024; // 8MB
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return {
            isValid: false,
            reason: `Tipo de archivo no permitido. Formatos permitidos: ${allowedMimeTypes.join(', ')}`
        };
    }
    
    if (file.size > maxSize) {
        return {
            isValid: false,
            reason: `El archivo es demasiado grande. Tamaño máximo: ${maxSize / 1024 / 1024}MB`
        };
    }
    
    return { isValid: true, reason: null };
}

// Calcular similitud entre strings (para comparación de nombres)
function calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1.0;

    // Normalizar textos
    const normalize = (text) => {
        return text
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remover acentos
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    };

    const cleanStr1 = normalize(str1);
    const cleanStr2 = normalize(str2);

    if (cleanStr1.length < 2 || cleanStr2.length < 2) return 0;

    // Algoritmo de similitud de Jaccard usando bigramas
    const getBigrams = (text) => {
        const bigrams = [];
        for (let i = 0; i < text.length - 1; i++) {
            bigrams.push(text.substr(i, 2));
        }
        return bigrams;
    };

    const bigrams1 = getBigrams(cleanStr1);
    const bigrams2 = getBigrams(cleanStr2);

    const intersection = bigrams1.filter(bigram => 
        bigrams2.includes(bigram)
    ).length;

    return (2.0 * intersection) / (bigrams1.length + bigrams2.length);
}

// Middleware de validación simple para express
const validateRequest = (validationFunction) => {
    return (req, res, next) => {
        const validationResult = validationFunction(req.body);
        
        if (!validationResult.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Datos de entrada no válidos',
                errors: validationResult.errors
            });
        }
        
        // Reemplazar el body con los datos validados y limpiados
        req.body = validationResult.data || req.body;
        next();
    };
};

module.exports = {
    validateCedula,
    validateEmail,
    validatePassword,
    validateName,
    cleanName,
    validateUserRegistration,
    validateDocumentVerification,
    validateRequest,
    validateImageFile,
    calculateSimilarity
};