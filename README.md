# Flow of Services

Componente web (`<flow-of-services>`) para insertar en cualquier página un flujo de solicitud de servicios:

**Servicio → Fecha y hora → Datos de contacto → Resumen → Confirmación**

- Solo front-end, sin dependencias ni paso de compilación.
- Estilos aislados (Shadow DOM): no choca con el CSS de la página donde lo insertes.
- Todo se configura con JSON: servicios, precios, horarios, campos del formulario y textos.
- Emite eventos para que la página decida qué hacer con la solicitud (enviarla a una API, WhatsApp, correo, etc.).

## Probarlo localmente

```bash
npx serve .
```

Abre la URL que muestre (por ejemplo `http://localhost:3000`). Hace falta un servidor porque los módulos JS y `config-src` no funcionan abriendo el archivo directamente.

## Insertarlo en una página

```html
<flow-of-services config-src="servicios.json"></flow-of-services>
<script type="module" src="flow-of-services.js"></script>
```

Solo necesitas copiar `src/flow-of-services.js` (y tu JSON de configuración) al sitio.

### Formas de configurarlo

1. **Archivo JSON externo** — `config-src="ruta/servicios.json"`
2. **JSON en línea**
   ```html
   <flow-of-services>
     <script type="application/json">
       { "title": "Reserva", "services": [{ "id": "a", "name": "Corte", "price": 20 }] }
     </script>
   </flow-of-services>
   ```
3. **Desde JavaScript**
   ```js
   document.querySelector('flow-of-services').config = { title: 'Reserva', services: [...] };
   ```

Lo que no definas usa los valores por defecto (ver `DEFAULT_CONFIG` en `src/flow-of-services.js`).

### Opciones

| Clave | Descripción |
| --- | --- |
| `title` | Título del componente |
| `locale`, `currency` | Formato de fechas y precios (`es-MX`, `USD`) |
| `multiple` | `true` permite elegir varios servicios |
| `steps` | Orden de pasos: `service`, `schedule`, `details`, `summary`. Quita `schedule` si no necesitas fecha/hora |
| `services[]` | `{ id, name, description?, price?, duration? }` |
| `schedule` | `{ days, start, end, interval, closedWeekdays }` (0 = domingo) |
| `fields[]` | `{ name, label, type, required?, placeholder? }` — `type` puede ser `text`, `email`, `tel`, `textarea`, etc. |
| `labels` | Todos los textos de la interfaz (para traducir o cambiar el tono) |
| `endpoint` | URL a la que se envía la solicitud por `POST` (también como atributo `endpoint="..."`) |

## Eventos

```js
const flow = document.querySelector('flow-of-services');

flow.addEventListener('fos:submit', (e) => {
  console.log(e.detail); // { services, total, currency, date, time, contact, createdAt }
  // e.preventDefault() evita el envío al endpoint (si lo hay) y muestra la confirmación igual
});
```

| Evento | `detail` |
| --- | --- |
| `fos:step` | `{ step, index }` al cambiar de paso |
| `fos:submit` | la solicitud completa (cancelable) |
| `fos:success` | `{ payload, response }` tras enviar al `endpoint` |
| `fos:error` | `{ payload, error }` si falla el envío |

Método público: `flow.reset()` vuelve al primer paso.

## Personalizar el diseño

Con variables CSS desde la página:

```css
flow-of-services {
  --fos-primary: #db2777;
  --fos-radius: 20px;
  --fos-font: "Poppins", sans-serif;
  max-width: 640px;
}
```

Variables disponibles: `--fos-primary`, `--fos-primary-text`, `--fos-bg`, `--fos-surface`, `--fos-text`, `--fos-muted`, `--fos-border`, `--fos-danger`, `--fos-radius`, `--fos-font`.

## Estructura

```
index.html                 Página de demo
src/flow-of-services.js    El componente (lo único que necesitas copiar)
examples/servicios.json    Configuración de ejemplo
```
