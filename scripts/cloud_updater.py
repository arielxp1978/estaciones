import os
import json
import datetime
import re
from supabase_loader import load_to_supabase

def standardize_fuel_names(original_name):
    """
    Estandariza los nombres de combustibles según el pedido del usuario.
    """
    name = original_name.lower()
    # Casos de Nafta Premium y Diesel Premium
    if "infinia" in name or "v-power" in name:
        return "Nafta Premium y Diesel Premium"
    
    # Otros casos comunes (puedes agregar más aquí)
    if "súper" in name or "super" in name:
        return "Nafta Súper"
        
    return original_name

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
                    # Modificado para no excluir la palabra 'Banco' que es parte de los datos
                    if line.startswith("|") and not ("| :---" in line or "| Banco o Billetera" in line):
                        cols = [c.strip() for c in line.split("|")]
                        # Estructura: | empty | Banco | Medio | Dia | Fuel | % | Tope | Max | Vigencia | Obs | empty |
                        if len(cols) >= 9:
                            try:
                                # Limpiar asteriscos de negrita si existen
                                banco = cols[1].replace("**", "")
                                
                                # Estandarizar combustible
                                combustible = standardize_fuel_names(cols[4])
                                
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
                                    "combustible": combustible,
                                    "descuento": descuento,
                                    "tope": tope,
                                    "vigencia": vigencia
                                })
                            except Exception as e:
                                print(f"Error parseando línea en {filename}: {e}")
    
    return beneficios

def generate_ai_summaries(beneficios):
    """
    Genera resúmenes estructurados (simulando IA) para ahorrar tokens en consultas futuras.
    """
    summaries = []
    
    # 1. Resumen General (Mejores Descuentos)
    mejores = sorted(beneficios, key=lambda x: x['descuento'], reverse=True)[:5]
    resumen_gral = "### 🚀 Mejores Ahorros de la Semana\n\n"
    for b in mejores:
        resumen_gral += f"- **{b['descuento']}%** en **{b['estacion']}** con **{b['banco']}** ({b['dia']}). Tope: ${b['tope']}.\n"
    
    summaries.append({
        "tipo": "general",
        "contenido": resumen_gral
    })
    
    # 2. Resúmenes por Tipo de Combustible
    combustibles = set(b['combustible'] for b in beneficios if b['combustible'] != 'Todos')
    for fuel in combustibles:
        f_beneficios = [b for b in beneficios if b['combustible'] == fuel or b['combustible'] == 'Todos']
        f_mejores = sorted(f_beneficios, key=lambda x: x['descuento'], reverse=True)[:3]
        
        resumen_fuel = f"### ⛽ Ahorros en {fuel}\n\n"
        if f_mejores:
            for b in f_mejores:
                resumen_fuel += f"- **{b['estacion']}**: {b['descuento']}% dto. con {b['banco']} ({b['dia']}).\n"
        else:
            resumen_fuel += "No se encontraron ofertas específicas para este combustible hoy."
            
        summaries.append({
            "tipo": fuel.lower(),
            "contenido": resumen_fuel
        })
        
    return summaries

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

    # 1.5. Ejecutar Motor de Verificación (NUEVO)
    try:
        from verification_engine import run_verification
        print("Corriendo motor de verificación secundaria...")
        run_verification()
    except ImportError:
        print("Motor de verificación no encontrado, saltando...")

    # 2. Cargar beneficios detallados a la nube (Supabase)
    # Plan de almacenamiento y caché:
    # - **SUPABASE**: Base de datos accesible vía API.
    # - **AI CACHE**: Tabla `analisis_ia` para guardar resúmenes pre-procesados y ahorrar tokens.
    # - **DOUBLE VERIFICATION**: Motor que escanea directamente links bancarios de alta prioridad.
    load_to_supabase(data, "beneficios")
    
    # 3. Generar y cargar resúmenes para el caché de IA
    print("Generando resúmenes para el caché de IA...")
    summaries = generate_ai_summaries(data)
    load_to_supabase(summaries, "analisis_ia")
    
    # 4. Guardar copia local en JSON para auditoría
    json_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ultimo_relevamiento.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    
    print("Proceso finalizado correctamente.")

if __name__ == "__main__":
    update_cloud()
