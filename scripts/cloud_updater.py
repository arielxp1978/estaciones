import os
import json
import datetime
import re
from supabase_loader import load_to_supabase

def parse_markdown_files(directory):
    """
    Lee los archivos .md y extrae la información de las tablas.
    """
    beneficios = []
    # Patrón para identificar archivos de beneficios
    file_pattern = re.compile(r"beneficios_(\w+)_enero_2026\.md")
    
    for filename in os.listdir(directory):
        match = file_pattern.match(filename)
        if match:
            estacion = match.group(1).capitalize()
            # Tratar 'Ypf' como 'YPF'
            if estacion == "Ypf": estacion = "YPF"
            
            filepath = os.path.join(directory, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                lines = f.readlines()
                
                for line in lines:
                    # Buscamos líneas que empiecen con | y no sean cabeceras o separadores
                    if line.startswith("|") and not ("Banco" in line or "---" in line):
                        cols = [c.strip() for c in line.split("|")]
                        # Estructura: | empty | Banco | Medio | Dia | Fuel | % | Tope | Max | Vigencia | Obs | empty |
                        if len(cols) >= 9:
                            try:
                                # Limpiar asteriscos de negrita si existen
                                banco = cols[1].replace("**", "")
                                
                                # Extraer solo el número del descuento (ej: "10%" -> 10)
                                desc_str = re.search(r"(\d+)", cols[5])
                                descuento = int(desc_str.group(1)) if desc_str else 0
                                
                                # Extraer solo el número del tope (ej: "$3.000" -> 3000)
                                tope_str = cols[6].replace(".", "").replace("$", "")
                                tope_match = re.search(r"(\d+)", tope_str)
                                tope = int(tope_match.group(1)) if tope_match else 0
                                
                                # Convertir vigencia DD/MM/AAAA a AAAA-MM-DD
                                vigencia_match = re.search(r"(\d{2})/(\d{2})/(\d{4})", cols[8])
                                if vigencia_match:
                                    vigencia = f"{vigencia_match.group(3)}-{vigencia_match.group(2)}-{vigencia_match.group(1)}"
                                else:
                                    # Fallback manual para Enero 2026 si no hay match
                                    if "01/01" in cols[8]:
                                        vigencia = "2026-01-31"
                                    else:
                                        vigencia = "2026-01-01" # Default safety

                                beneficios.append({
                                    "estacion": estacion,
                                    "banco": banco,
                                    "medio_pago": cols[2],
                                    "dia": cols[3],
                                    "combustible": cols[4],
                                    "descuento": descuento,
                                    "tope": tope,
                                    "vigencia": vigencia
                                })
                            except Exception as e:
                                print(f"Error parseando línea en {filename}: {e}")
    
    return beneficios

def update_cloud():
    print(f"Iniciando actualización de beneficios - {datetime.datetime.now()}")
    
    # Directorio base (un nivel arriba de scripts/)
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # 1. Obtener datos parseando los archivos MD
    data = parse_markdown_files(base_dir)
    
    if not data:
        print("No se encontraron beneficios nuevos o hubo un error en el parsing.")
        return

    print(f"Se encontraron {len(data)} beneficios para cargar.")

    # 2. Cargar a la nube (Supabase)
    load_to_supabase(data)
    
    # 3. Guardar copia local en JSON para auditoría
    json_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ultimo_relevamiento.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    
    print("Proceso finalizado correctamente.")

if __name__ == "__main__":
    update_cloud()
