# Guía de Integración: API para Otros Sistemas

Esta guía detalla cómo cualquier sistema externo (una App móvil, una web, o un bot de WhatsApp) puede consumir los datos de beneficios de combustible desde tu base de datos en Supabase.

## 1. Datos de Seguridad Necessarios
Para conectarse, el sistema externo necesitará dos credenciales que obtienes de **Supabase > Settings > API**:

1.  **Project URL**: La dirección base de tu base de datos (Ej: `https://dodhhkrhiuphfwxdekqu.supabase.co`).
2.  **API Key (Anon Public)**: La clave que permite leer datos de la tabla.
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvZGhoa3JoaXVwaGZ3eGRla3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MTA4NTAsImV4cCI6MjA4MjA4Njg1MH0.u3_zDNLi5vybfH1ueKgbVMg9JlpVoT7SFCcvzS_miN0

> [!IMPORTANT]
> Nunca compartas la `service_role key` con sistemas externos públicos. Usa siempre la `anon public key`.

## 2. Acceso vía API REST (JSON)
Supabase crea automáticamente una API profesional. Para consultar todos los beneficios, el sistema debe hacer una petición **GET** a:

`https://estaciones.supabase.co/rest/v1/beneficios?select=*`

### Cabeceras (Headers) requeridas:
```http
apikey: TU_ANON_PUBLIC_KEY
Authorization: Bearer TU_ANON_PUBLIC_KEY
```

### Ejemplo de Filtro (Solo Shell):
Para traer solo los de Shell:
`...?estacion=eq.Shell&select=*`

## 3. Composición y Esquema de Datos
El sistema recibirá un JSON con la siguiente estructura por cada registro:

| Campo | Tipo | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- |
| `id` | int8 | Identificador único del beneficio. | `125` |
| `created_at` | timestamp | Fecha/hora en que se cargó el dato. | `2025-12-23T14:00:00Z` |
| `estacion` | text | Marca de la petrolera (YPF, Shell, etc.). | `YPF`, `Shell`, `Axion` |
| `banco` | text | Entidad que otorga el beneficio. | `Banco Nación`, `Galicia` |
| `medio_pago` | text | Cómo se debe pagar para obtenerlo. | `MODO QR`, `App YPF` |
| `dia` | text | Días de vigencia del descuento. | `Lunes`, `Viernes a Domingo` |
| `combustible` | text | Tipo de combustible aplicable. | `Nafta Premium y Diesel Premium`, `Nafta Súper` |
| `descuento` | int4 | Porcentaje de descuento (sin símbolo %). | `30` |
| `tope` | int4 | Tope de reintegro en pesos. | `15000` |
| `vigencia` | date | Fecha de expiración del beneficio. | `2026-01-31` |

## 4. Consumo del Caché de IA (Recomendado)
Para ahorrar tokens en tu sistema de consulta, te recomendamos consultar primero la tabla `analisis_ia`. Esta tabla contiene resúmenes pre-procesados en Markdown listos para mostrar al usuario.

**EndPoint**: `https://tu-proyecto.supabase.co/rest/v1/analisis_ia?select=*`

### Tipos de Análisis Disponibles:
- `general`: Los 5 mejores descuentos de todas las estaciones.
- `nafta premium y diesel premium`: Resumen específico para cargas premium.
- `nafta súper`: Resumen específico para nafta común.

**Ejemplo de Consulta (Filtro por Tipo):**
`...?tipo=eq.general&select=contenido`

## 5. Ejemplos de Implementación

### En Javascript (Node.js o Frontend):
```javascript
const URL = 'https://tu-proyecto.supabase.co/rest/v1/beneficios?select=*';
const API_KEY = 'TU_ANON_KEY';

fetch(URL, {
  headers: {
    'apikey': API_KEY,
    'Authorization': `Bearer ${API_KEY}`
  }
})
.then(res => res.json())
.then(data => console.log('Beneficios cargados:', data));
```

### En Python:
```python
import requests

url = "https://tu-proyecto.supabase.co/rest/v1/beneficios"
headers = {
    "apikey": "TU_ANON_KEY",
    "Authorization": "Bearer TU_ANON_KEY"
}

response = requests.get(url, headers=headers)
beneficios = response.json()
print(f"Se encontraron {len(beneficios)} beneficios.")
```

## 6. Ejemplo de Respuesta (JSON)
```json
[
  {
    "estacion": "Shell",
    "banco": "Banco Nación",
    "medio_pago": "MODO QR",
    "dia": "Viernes a Domingo",
    "combustible": "Nafta Premium y Diesel Premium",
    "descuento": 30,
    "tope": 15000,
    "vigencia": "2026-01-31"
  }
]
```

---
*Esta estructura permite que cualquier programador conecte su sistema en minutos usando bibliotecas estándar de HTTP.*
