const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class PythonBridge {
  constructor() {
    this.pythonPath = 'python'; // o 'python3' en algunos sistemas
  }

  // Ejecutar script de Python y obtener resultados
  async runPythonScript(scriptName, args = {}) {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, 'python', scriptName);
      
      // Verificar que el script existe
      if (!fs.existsSync(scriptPath)) {
        return reject(new Error(`Python script not found: ${scriptPath}`));
      }

      console.log(`Ejecutando Python: ${scriptName}`, args);
      
      const pythonProcess = spawn(this.pythonPath, [scriptPath, JSON.stringify(args)]);
      
      let result = '';
      let error = '';
      
      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
        console.log(`Python stdout: ${data}`);
      });
      
      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
        console.error(`Python stderr: ${data}`);
      });
      
      pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
        if (code === 0) {
          try {
            // Intentar parsear como JSON
            const parsedResult = JSON.parse(result);
            resolve(parsedResult);
          } catch (e) {
            // Si no es JSON, devolver el texto plano
            resolve(result.trim());
          }
        } else {
          reject(new Error(`Python script failed with code ${code}: ${error}`));
        }
      });
      
      pythonProcess.on('error', (err) => {
        console.error('Failed to start Python process:', err);
        reject(new Error(`Failed to start Python process: ${err.message}`));
      });
    });
  }
  
  // Preprocesar imagen usando Python
  async preprocessImage(imagePath) {
    try {
      console.log(`Preprocesando imagen: ${imagePath}`);
      const result = await this.runPythonScript('image_preprocessor.py', {
        action: 'preprocess',
        imagePath: imagePath
      });
      
      if (result && result.error) {
        throw new Error(result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Error en preprocesamiento Python:', error);
      throw error;
    }
  }
  
  // Ejecutar OCR en región específica
  async extractTextFromROI(imagePath, roi) {
    try {
      console.log(`Extrayendo texto de ROI: ${JSON.stringify(roi)}`);
      const result = await this.runPythonScript('ocr_processor.py', {
        action: 'extract_text',
        imagePath: imagePath,
        roi: roi
      });
      
      if (result && result.error) {
        throw new Error(result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Error en extracción Python:', error);
      throw error;
    }
  }
}

module.exports = new PythonBridge();