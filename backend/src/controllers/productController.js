const Product = require('../models/Product');
const { validationResult } = require('express-validator');

// Crear nuevo producto
exports.createProduct = async (req, res) => {
  try {
    // Validar errores
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      price,
      category,
      condition = 'usado',
      location,
      brand,
      deliveryOptions = [],
      availability = 'in_stock',
      tags = []
    } = req.body;

    // Verificar duplicados (mismo título y mismo vendedor)
    const existingProduct = await Product.findOne({
      title: title.trim(),
      seller: req.userId,
      status: { $in: ['active', 'reserved'] }
    });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Ya tienes un producto activo con el mismo título'
      });
    }

    // Procesar imágenes (base64)
    const images = req.body.images && Array.isArray(req.body.images) 
      ? req.body.images.map((img, index) => ({
          url: img,
          isPrimary: index === 0
        }))
      : [];

    // Crear producto
    const product = new Product({
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category: category.toLowerCase(),
      condition,
      images,
      seller: req.userId,
      location: {
        city: location.trim(),
        state: ''
      },
      brand: brand ? brand.trim() : undefined,
      deliveryOptions,
      availability,
      tags: tags.map(tag => tag.trim().toLowerCase()),
      isApproved: true
    });

    await product.save();
    await product.populate('seller', 'firstName lastName avatar isVerified');

    res.status(201).json({
      success: true,
      message: 'Producto publicado exitosamente',
      product
    });

  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener todos los productos
exports.getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      minPrice,
      maxPrice,
      condition,
      location,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = { status: 'active', isApproved: true };

    // Filtros
    if (category) filter.category = category.toLowerCase();
    if (condition) filter.condition = condition;
    if (location) filter['location.city'] = new RegExp(location, 'i');
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(filter)
      .populate('seller', 'firstName lastName avatar isVerified')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener producto por ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'firstName lastName avatar isVerified email phone')
      .populate('soldTo', 'firstName lastName');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Incrementar contador de vistas
    product.viewCount += 1;
    await product.save();

    res.json({
      success: true,
      product
    });

  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar producto
exports.updateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array()
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Verificar que el usuario es el dueño
    if (product.seller.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para editar este producto'
      });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && key !== 'seller' && key !== '_id') {
        product[key] = updates[key];
      }
    });

    await product.save();
    await product.populate('seller', 'firstName lastName avatar isVerified');

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      product
    });

  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar producto
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    if (product.seller.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar este producto'
      });
    }

    product.status = 'deleted';
    await product.save();

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener productos del usuario
exports.getUserProducts = async (req, res) => {
  try {
    const { status = 'active' } = req.query;
    
    const filter = { 
      seller: req.userId,
      status: { $in: status.split(',') }
    };

    const products = await Product.find(filter)
      .populate('seller', 'firstName lastName avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      products
    });

  } catch (error) {
    console.error('Error getting user products:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};