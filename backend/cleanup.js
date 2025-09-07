const mongoose = require('mongoose');
require('dotenv').config();

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    const db = mongoose.connection.db;
    
    // 1. Eliminar índice problemático
    try {
      await db.collection('verifications').dropIndex('documentHash_1');
      console.log('✅ Índice eliminado');
    } catch (error) {
      console.log('ℹ️ Índice no existía o no se pudo eliminar:', error.message);
    }

    // 2. Crear índice sparse
    await db.collection('verifications').createIndex(
      { documentHash: 1 },
      { unique: true, sparse: true, background: true }
    );
    console.log('✅ Índice sparse creado');

    // 3. Limpiar verificaciones existentes con documentHash: null
    const result = await db.collection('verifications').deleteMany({
      documentHash: null,
      status: { $in: ['rejected', 'expired'] }
    });
    console.log(`✅ ${result.deletedCount} verificaciones limpiadas`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanup();