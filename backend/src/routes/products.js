const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, requireVerification } = require('../middleware/auth');
const { body } = require('express-validator');

// Validaciones
const productValidation = [
  body('title')
    .trim()
    .isLength({ min: 10, max: 100 })
    .withMessage('El título debe tener entre 10 y 100 caracteres'),
  body('description')
    .trim()
    .isLength({ min: 20, max: 1000 })
    .withMessage('La descripción debe tener entre 20 y 1000 caracteres'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo'),
  body('category')
    .isIn(['tecnologia', 'hogar', 'ropa', 'deportes', 'vehiculos', 'inmuebles', 'empleos', 'servicios', 'otros'])
    .withMessage('Categoría no válida'),
  body('condition')
    .optional()
    .isIn(['nuevo', 'usado', 'reacondicionado'])
    .withMessage('Condición no válida'),
  body('location')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('La ubicación debe tener entre 3 y 100 caracteres')
];

// Rutas públicas
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

// Rutas protegidas (requieren autenticación y verificación)
router.post('/', authenticate, requireVerification, productValidation, productController.createProduct);
router.put('/:id', authenticate, requireVerification, productValidation, productController.updateProduct);
router.delete('/:id', authenticate, requireVerification, productController.deleteProduct);
router.get('/user/products', authenticate, requireVerification, productController.getUserProducts);

module.exports = router;