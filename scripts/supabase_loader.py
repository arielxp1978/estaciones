import os
import json
from supabase import create_client, Client

def load_to_supabase(data):
    """
    Carga una lista de beneficios en la tabla 'beneficios' de Supabase.
    """
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")

    if not url or not key:
        print("Error: SUPABASE_URL y SUPABASE_KEY deben estar configuradas como variables de entorno.")
        return

    supabase: Client = create_client(url, key)

    # Limpiar datos antiguos (opcional, dependiendo de si quieres historial o solo vigencia actual)
    # Por ahora, simplemente insertamos los nuevos
    
    try:
        response = supabase.table("beneficios").insert(data).execute()
        print(f"Carga exitosa: {len(data)} registros insertados.")
    except Exception as e:
        print(f"Error cargando a Supabase: {e}")

if __name__ == "__main__":
    # Ejemplo de uso con datos locales de prueba
    test_data = [
        {
            "estacion": "Shell",
            "banco": "Banco Nación",
            "medio_pago": "MODO",
            "dia": "Viernes",
            "combustible": "Todos",
            "descuento": 30,
            "tope": 15000,
            "vigencia": "2026-01-31"
        }
    ]
    load_to_supabase(test_data)
