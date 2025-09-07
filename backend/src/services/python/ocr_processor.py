import cv2
import pytesseract
import numpy as np
import json
import sys
import os
import re

# Configurar Tesseract
try:
    windows_paths = [
        r'C:\Program Files\Tesseract-OCR\tesseract.exe',
        r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe'
    ]
    
    for tesseract_path in windows_paths:
        if os.path.exists(tesseract_path):
            pytesseract.pytesseract.tesseract_cmd = tesseract_path
            break
except Exception as e:
    pass

def extract_text_from_image(image_path):
    """Extraer texto de imagen con configuración optimizada para cédulas"""
    try:
        cv2.setLogLevel(0)
        
        if not os.path.exists(image_path):
            return {"error": f"El archivo no existe: {image_path}"}
        
        # Leer imagen
        img = cv2.imread(image_path)
        if img is None:
            return {"error": "No se pudo cargar la imagen"}
        
        # Configuración OPTIMIZADA para cédulas colombianas
        custom_config = r'--oem 3 --psm 6 -l spa+eng'
        
        # Ejecutar OCR en la imagen completa
        full_text = pytesseract.image_to_string(img, config=custom_config)
        
        # Extraer texto de ROI específicas (regiones de interés para cédulas)
        text_regions = extract_text_from_regions(img)
        
        # Combinar resultados
        combined_text = full_text + "\n" + text_regions
        
        # Limpiar texto
        cleaned_text = clean_ocr_text(combined_text)
        
        return {
            "success": True, 
            "text": cleaned_text,
            "original_length": len(full_text),
            "cleaned_length": len(cleaned_text)
        }
        
    except Exception as e:
        return {"error": str(e)}

def extract_text_from_regions(img):
    """Extraer texto de regiones específicas de cédulas colombianas"""
    height, width = img.shape[:2]
    regions_text = []
    
    # Regiones típicas de cédulas colombianas
    regions = [
        # Región superior (número de documento)
        {"y": int(height * 0.1), "h": int(height * 0.15), "x": int(width * 0.3), "w": int(width * 0.4)},
        # Región nombres
        {"y": int(height * 0.3), "h": int(height * 0.1), "x": int(width * 0.1), "w": int(width * 0.8)},
        # Región apellidos
        {"y": int(height * 0.4), "h": int(height * 0.1), "x": int(width * 0.1), "w": int(width * 0.8)},
        # Región información adicional
        {"y": int(height * 0.6), "h": int(height * 0.3), "x": int(width * 0.1), "w": int(width * 0.8)}
    ]
    
    custom_config = r'--oem 3 --psm 8 -l spa+eng'
    
    for region in regions:
        try:
            roi = img[region["y"]:region["y"]+region["h"], region["x"]:region["x"]+region["w"]]
            text = pytesseract.image_to_string(roi, config=custom_config)
            if text.strip():
                regions_text.append(text.strip())
        except:
            continue
    
    return "\n".join(regions_text)

def clean_ocr_text(text):
    """Limpieza MEJORADA de texto OCR para cédulas"""
    if not text:
        return ""
    
    # 1. Remover caracteres especiales pero mantener letras, números y espacios
    cleaned = re.sub(r'[^\w\sáéíóúñÁÉÍÓÚÑ\d\.\-]', ' ', text)
    
    # 2. Normalizar espacios
    cleaned = re.sub(r'\s+', ' ', cleaned)
    
    # 3. Filtrar líneas válidas para cédulas
    lines = cleaned.split('\n')
    filtered_lines = []
    
    for line in lines:
        line = line.strip()
        if is_valid_cedula_line(line):
            filtered_lines.append(line)
    
    # 4. Unir líneas válidas
    result = '\n'.join(filtered_lines).strip()
    
    return result

def is_valid_cedula_line(line):
    """Determinar si una línea es válida para cédulas colombianas"""
    if len(line) < 3:
        return False
    
    # Excluir líneas con puros números muy largos
    if re.match(r'^\d{15,}$', line):
        return False
    
    # Excluir líneas con muchos caracteres especiales
    if len(re.findall(r'[^\w\sáéíóúñÁÉÍÓÚÑ]', line)) > len(line) * 0.3:
        return False
    
    # Excluir líneas que son probablemente ruido
    noise_patterns = [
        r'tesseract|ocr|python|cv2',
        r'program files|windows|system',
        r'http|www|\.com|\.org',
        r'preprocesando|imagen|procesada|guardada',
        r'extrayendo texto|texto extraído|analizando'
    ]
    
    line_lower = line.lower()
    if any(re.search(pattern, line_lower) for pattern in noise_patterns):
        return False
    
    return True

if __name__ == "__main__":
    if len(sys.argv) > 1:
        try:
            image_path = sys.argv[1]
            result = extract_text_from_image(image_path)
            print(json.dumps(result))
        except Exception as e:
            print(json.dumps({"error": f"Error: {str(e)}"}))