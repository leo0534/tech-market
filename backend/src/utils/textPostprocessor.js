const { COMMON_NAMES, COMMON_LASTNAMES } = require('./constants');

class TextPostprocessor {
  // Limpiar texto de OCR
  cleanText(text, type = 'general') {
    if (!text) return '';
    
    let cleaned = text
      .replace(/[^\w\sáéíóúñÁÉÍÓÚÑ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    switch (type) {
      case 'document_number':
        return cleaned.replace(/\D/g, '');
      case 'name':
        return this.cleanName(cleaned);
      default:
        return cleaned;
    }
  }
  
  // Limpiar nombre
  cleanName(name) {
    return name
      .replace(/\b(APELLIDOS?|NOMBRES?|CEDULA|DOCUMENTO)\b/gi, '')
      .replace(/[^a-zA-ZÁÉÍÓÚÑáéíóúñ\s]/g, '')
      .trim();
  }
  
  // Validar y corregir usando diccionario
  correctWithDictionary(text, dictionary, minSimilarity = 0.7) {
    if (!text) return '';
    
    const words = text.toUpperCase().split(/\s+/);
    const corrected = [];
    
    for (const word of words) {
      if (word.length < 2) {
        corrected.push(word);
        continue;
      }
      
      let bestMatch = word;
      let highestSimilarity = 0;
      
      for (const dictWord of dictionary) {
        const similarity = this.calculateSimilarity(word, dictWord);
        if (similarity > highestSimilarity && similarity >= minSimilarity) {
          highestSimilarity = similarity;
          bestMatch = dictWord;
        }
      }
      
      corrected.push(bestMatch);
    }
    
    return corrected.join(' ');
  }
  
  // Calcular similitud entre palabras (simple)
  calculateSimilarity(s1, s2) {
    if (!s1 || !s2) return 0;
    
    s1 = s1.toUpperCase();
    s2 = s2.toUpperCase();
    
    if (s1 === s2) return 1.0;
    
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    // Similitud basada en subcadena común
    if (longer.includes(shorter)) {
      return shorter.length / longer.length;
    }
    
    // Similitud simple para empezar
    const commonChars = new Set();
    for (const char of shorter) {
      if (longer.includes(char)) {
        commonChars.add(char);
      }
    }
    
    return commonChars.size / Math.max(s1.length, s2.length);
  }
}

module.exports = new TextPostprocessor();