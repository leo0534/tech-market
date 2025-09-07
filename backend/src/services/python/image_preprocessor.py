import cv2
import numpy as np
import json
import sys
import os

def preprocess_image(image_path):
    """Preprocesamiento ESPECÍFICO para cédulas colombianas"""
    try:
        # Silenciar logs de OpenCV
        cv2.setLogLevel(0)
        
        if not os.path.exists(image_path):
            return {"error": f"Archivo no encontrado: {image_path}"}
        
        # Leer imagen
        img = cv2.imread(image_path)
        if img is None:
            return {"error": "No se pudo cargar la imagen"}
        
        # 1. Convertir a escala de grises
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # 2. Redimensionar para mejorar OCR (mínimo 1000px de ancho para cédulas)
        height, width = gray.shape
        if width < 1000:
            scale_factor = 1000 / width
            new_width = 1000
            new_height = int(height * scale_factor)
            gray = cv2.resize(gray, (new_width, new_height))
            print(f"Imagen redimensionada: {new_width}x{new_height}")
        
        # 3. Mejorar contraste con CLAHE (específico para documentos)
        clahe = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(16, 16))
        enhanced = clahe.apply(gray)
        
        # 4. Reducir ruido preservando bordes (especialmente texto)
        denoised = cv2.bilateralFilter(enhanced, 15, 100, 100)
        
        # 5. Binarización adaptativa para texto en documentos
        binary = cv2.adaptiveThreshold(
            denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 21, 10
        )
        
        # 6. Operaciones morfológicas para limpiar texto
        kernel = np.ones((1, 1), np.uint8)
        cleaned = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
        cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_OPEN, kernel)
        
        # 7. Enfocar bordes para mejorar texto
        kernel_sharpen = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
        sharpened = cv2.filter2D(cleaned, -1, kernel_sharpen)
        
        # Guardar imagen procesada
        base_name = os.path.basename(image_path)
        name_without_ext = os.path.splitext(base_name)[0]
        processed_path = os.path.join(
            os.path.dirname(image_path), 
            f"{name_without_ext}_processed.jpg"
        )
        
        cv2.imwrite(processed_path, sharpened)
        
        return {
            "success": True, 
            "processedPath": processed_path,
            "originalSize": f"{width}x{height}",
            "processedSize": f"{sharpened.shape[1]}x{sharpened.shape[0]}"
        }
        
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) > 1:
        try:
            image_path = sys.argv[1]
            result = preprocess_image(image_path)
            print(json.dumps(result))
        except Exception as e:
            print(json.dumps({"error": f"Error processing image: {str(e)}"}))