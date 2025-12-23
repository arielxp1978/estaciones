import os
import json
from supabase import create_client, Client

def load_to_supabase(data, table_name="beneficios"):
    """
    Carga una lista de datos en la tabla especificada de Supabase.
    """
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")

    if not url or not key:
        print("Error: SUPABASE_URL y SUPABASE_KEY deben estar configuradas como variables de entorno.")
        return

    supabase: Client = create_client(url, key)

    try:
        response = supabase.table(table_name).insert(data).execute()
        print(f"Carga exitosa en '{table_name}': {len(data)} registros insertados.")
    except Exception as e:
        print(f"Error cargando a table '{table_name}': {e}")

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
