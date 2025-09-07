// Zonas de interés para cédulas colombianas (coordenadas aproximadas)
// ESTAS COORDENADAS DEBEN AJUSTARSE SEGÚN TUS IMÁGENES REALES
const CEDULA_ROIS = {
  FRONTAL: {
    DOCUMENT_NUMBER: { x: 100, y: 200, width: 300, height: 50, name: 'document_number' },
    LAST_NAME: { x: 100, y: 250, width: 300, height: 50, name: 'last_name' },
    FIRST_NAME: { x: 100, y: 300, width: 300, height: 50, name: 'first_name' }
  }
};

// Diccionarios de nombres colombianos comunes
const COMMON_NAMES = [
  'MARIA', 'JOSE', 'LUIS', 'CARLOS', 'JUAN', 'ANA', 'JORGE', 'ANDRES', 'FRANCISCO',
  'ALEJANDRO', 'RAFAEL', 'MIGUEL', 'PEDRO', 'ANTONIO', 'DIEGO', 'FERNANDO', 'RICARDO'
];

const COMMON_LASTNAMES = [
  'RODRIGUEZ', 'MARTINEZ', 'GARCIA', 'LOPEZ', 'HERNANDEZ', 'GONZALEZ', 'PEREZ',
  'SANCHEZ', 'RAMIREZ', 'TORRES', 'FLOREZ', 'DIAZ', 'MORALES', 'GOMEZ', 'CASTRO'
];

module.exports = {
  CEDULA_ROIS,
  COMMON_NAMES,
  COMMON_LASTNAMES
};