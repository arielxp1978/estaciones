import os
import requests
from bs4 import BeautifulSoup

# Lista de URLs de alta prioridad para verificar promociones que cambian frecuentemente
PRIORITY_LINKS = [
    {
        "nombre": "Banco Macro - YPF",
        "url": "https://www.macro.com.ar/selecta/combustible",
        "palabras_clave": ["YPF", "MODO", "miércoles", "Selecta"]
    },
    {
        "nombre": "Banco Nación - Combustibles",
        "url": "https://www.bna.com.ar/Personas/Promociones",
        "palabras_clave": ["MODO", "combustible", "viernes"]
    },
    {
        "nombre": "YPF ServiClub",
        "url": "https://www.ypf.com/serviclub/Paginas/Promociones.aspx",
        "palabras_clave": ["descuento", "canje", "puntos"]
    }
]

def run_verification():
    """
    Escanea links prioritarios para detectar si la información en la base de datos
    necesita ser actualizada.
    """
    print("Iniciando Verificación de Enlaces Prioritarios...")
    findings = []

    for link in PRIORITY_LINKS:
        try:
            print(f"Verificando: {link['nombre']}...")
            response = requests.get(link['url'], timeout=15)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                text = soup.get_text().lower()
                
                # Buscar palabras clave
                matches = [kw for kw in link['palabras_clave'] if kw.lower() in text]
                
                if matches:
                    findings.append({
                        "link": link['nombre'],
                        "status": "Online",
                        "matches": matches
                    })
                else:
                    findings.append({
                        "link": link['nombre'],
                        "status": "Atención: Palabras clave no encontradas",
                        "matches": []
                    })
            else:
                print(f"Error {response.status_code} al acceder a {link['url']}")
        except Exception as e:
            print(f"Error verificando {link['nombre']}: {e}")

    return findings

if __name__ == "__main__":
    results = run_verification()
    for res in results:
        print(f"[{res['status']}] {res['link']}: Encontró {res['matches']}")
