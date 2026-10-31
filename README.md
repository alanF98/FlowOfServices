# Website Brief

Componente web (`<website-brief>`) para insertar en una página que vende sitios web (pensado para **mycroi.com**). Le hace al cliente todas las preguntas necesarias para que una IA genere su sitio: tipo de negocio, nombre, objetivo, logo, colores, estilo, secciones, fotos, notas y contacto.

Solo front-end, sin dependencias ni compilación. Estilos aislados con Shadow DOM.
**Bilingüe:** inglés por defecto y español con `lang="es"`.

## El flujo

| # | Pregunta | Interacción |
| --- | --- | --- |
| 1 | ¿Qué tipo de negocio tienes? | 1 toque, avanza solo |
| 2 | ¿Cómo se llama? (+ frase opcional con sugerencias) | Escribir, Enter |
| 3 | ¿Qué quieres que logre la web de *{nombre}*? | 1 toque, avanza solo |
| 4 | ¿Tienes logo? | Subir (arrastrar o tocar) · "Créenme uno" · "Solo el nombre" |
| 5 | ¿Qué colores te gustan? | Paletas, colores **sacados del logo**, o personalizados |
| 6 | ¿Qué estilo va más con *{nombre}*? | Tarjetas visuales con su propio sitio, avanza solo |
| 7 | ¿Qué secciones necesitas? | Ya vienen marcadas según su negocio y objetivo |
| 8 | ¿Tienes fotos? | Subir varias · "Usen fotos profesionales" |
| 9 | ¿Algo más? | Opcional: web de referencia y notas libres |
| 10 | ¿A dónde te enviamos tu sitio? | Nombre + correo o WhatsApp, dominio opcional y resumen editable |

### Decisiones de diseño (psicología del flujo)

- **Arranque sin fricción:** la primera pregunta es la más fácil y se responde con un toque. Una vez que la persona empieza, es mucho más probable que termine.
- **Una pregunta por pantalla** y **avance automático** cuando basta con un toque. Se siente rápido.
- **Vista previa en vivo:** su sitio se va armando con cada respuesta (nombre, logo, colores, estilo, secciones, foto). La persona siente que ya es *suyo* y quiere verlo terminado.
- **Nunca se traba:** todo lo opcional tiene "Decide por mí" o "Saltar". Solo son obligatorios el nombre del negocio y un medio de contacto.
- **Valores inteligentes por defecto:** secciones recomendadas según el tipo de negocio y objetivo, y colores tomados del logo automáticamente. Es más fácil aceptar que decidir.
- **Personalización:** las preguntas usan el nombre del negocio ("¿Qué estilo va más con Studio Bella?").
- **Contacto al final**, cuando ya invirtió tiempo y quiere ver el resultado. Incluye mensaje de confianza y "sin compromiso".
- **Tiempo restante en lugar de "paso 3 de 10"**, y una barra de progreso que avanza más al principio. Se percibe más corto.
- **Retoma donde lo dejó:** el progreso se guarda en el navegador.
- **Resumen editable** antes de enviar: cada respuesta tiene "Editar" y regresa directo al final.

## Probarlo localmente

```bash
npx serve .
```

Abre la URL que muestre. Hace falta un servidor porque los módulos JS no funcionan abriendo el archivo directamente. La demo (`index.html`) muestra abajo el *prompt* y los datos que genera.

## Insertarlo en una página

```html
<website-brief></website-brief>             <!-- inglés -->
<website-brief lang="es"></website-brief>   <!-- español -->
<script type="module" src="website-brief.js"></script>
```

Solo necesitas copiar `src/website-brief.js`.

### Idioma

- `lang="en"` (por defecto) o `lang="es"`.
- Se puede cambiar en vivo, sin perder las respuestas: `brief.setAttribute('lang', 'es')`. Sirve para un selector de idioma en mycroi.com (la demo trae uno).
- El *prompt* para la IA sale en el mismo idioma y le pide construir el sitio en ese idioma.
- Para agregar otro idioma, copia el bloque `LOCALES.en` en `src/website-brief.js` y tradúcelo.
- Los identificadores del JSON son siempre en inglés (`beauty`, `booking`, `playful`…), sin importar el idioma.

### Recibir el resultado

```js
document.querySelector('website-brief').addEventListener('wb:submit', (e) => {
  const { brief, prompt, assets } = e.detail;
  // brief  → datos estructurados (JSON)
  // prompt → instrucciones ya redactadas para la IA que construye el sitio
  // assets → { logo: { name, dataUrl } | null, photos: [{ name, dataUrl }] }
});
```

O envíalo directo a tu servidor con `endpoint`:

```html
<website-brief endpoint="https://api.mycroi.com/briefs"></website-brief>
```

Se hace un `POST` con el JSON completo. `e.preventDefault()` en `wb:submit` cancela ese envío.

| Evento | `detail` |
| --- | --- |
| `wb:step` | `{ step, index }` al cambiar de paso (útil para analítica y embudo de abandono) |
| `wb:submit` | `{ brief, prompt, assets, createdAt }` (cancelable) |
| `wb:success` | `{ payload, response }` tras enviar al `endpoint` |
| `wb:error` | `{ payload, error }` si falla el envío |

Atributos: `lang`, `endpoint`, `config-src`, `no-persist` (no guarda el progreso).
Propiedades y métodos: `el.config`, `el.answers`, `el.reset()`.

Ejemplo del *prompt* generado (en inglés):

```
Create a complete, professional website in English for "Studio Bella".
Business type: beauty or spa.
Tagline: "Nails and beauty with style".
Main goal: get bookings. The main call-to-action button should say "Book now".
Logo: use the logo provided by the client.
Colors: primary #c026d3, secondary #0d9488, accent #0d9488, background #ffffff, text #111827.
Visual style: playful (cheerful, colorful, friendly).
Sections: Home, Services, Gallery, Pricing, Booking, Contact.
Photos: use professional stock photos related to beauty or spa.
The site must be responsive, fast, accessible and optimized for local SEO.
```

## Personalizar

La estructura (opciones, íconos, colores) está en `BASE` y los textos de cada idioma en `LOCALES`, al inicio de `src/website-brief.js`. Todo se puede sobrescribir sin tocar el código:

```js
document.querySelector('website-brief').config = {
  steps: ['business', 'name', 'goal', 'logo', 'colors', 'style', 'contact'], // quitar o reordenar pasos
  businessTypes: [...],   // { id, icon, label, pages[], examples[] }
  goals: [...],           // { id, icon, label, cta, page }
  palettes: [...],        // { id, label, colors: [primario, secundario, acento, fondo, texto] }
  styles: [...],          // { id, label, description, font, weight, radius, align, upper? }
  pages: [...],           // { id, label, locked? }
  copy: { business: { title: '...' }, submit: 'Get my website' },  // cualquier texto
  prompt: { outro: '...' },                                         // plantillas del prompt
};
```

También con `config-src="config.json"` o con un `<script type="application/json">` dentro de la etiqueta.

### Diseño del flujo

Con variables CSS desde la página:

```css
website-brief {
  --wb-primary: #4f46e5;
  --wb-radius: 20px;
  --wb-font: "Poppins", sans-serif;
}
```

Disponibles: `--wb-primary`, `--wb-primary-text`, `--wb-bg`, `--wb-surface`, `--wb-text`, `--wb-muted`, `--wb-border`, `--wb-danger`, `--wb-radius`, `--wb-font`.

El componente se adapta a su contenedor: en espacios anchos (≥ 820 px) muestra la vista previa al lado; en móvil, la vista previa se abre con un botón.

## Estructura

```
index.html              Página de demo
src/website-brief.js    El componente (lo único que necesitas copiar)
```

## Pendiente para producción

- **Backend:** las imágenes viajan como `dataUrl` (base64) dentro del JSON. Para muchas fotos conviene subirlas a un almacenamiento (S3, Cloudflare R2…) y enviar solo las URLs.
- **Analítica:** conectar `wb:step` para medir en qué paso abandona la gente y ajustar.
