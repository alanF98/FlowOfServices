/**
 * <website-brief> — flujo embebible que recoge todo lo necesario para que una IA
 * genere un sitio web: tipo de negocio, nombre, objetivo, logo, colores, estilo,
 * secciones, fotos, notas y contacto.
 *
 * Principios del flujo:
 *  - Una pregunta por pantalla; avance automático cuando basta un toque.
 *  - Empieza por lo más fácil y deja los datos de contacto para el final.
 *  - Vista previa en vivo del sitio que se arma con cada respuesta.
 *  - Todo lo opcional tiene "Decide por mí" / "Saltar".
 *  - Valores por defecto inteligentes (secciones según el negocio, colores del logo).
 *  - Guarda el progreso en el navegador para retomar después.
 *
 * Configuración (opcional, se combina con DEFAULT_CONFIG):
 *   el.config = { ... }                         desde JS
 *   <website-brief config-src="config.json">    archivo JSON
 *   <website-brief><script type="application/json">{...}</script></website-brief>
 *
 * Atributos: endpoint="https://..." (POST JSON al terminar), no-persist (no guarda progreso).
 *
 * Eventos:
 *   wb:step     { step, index }
 *   wb:submit   { brief, prompt, assets, createdAt }  (cancelable: evita el POST)
 *   wb:success  { payload, response }
 *   wb:error    { payload, error }
 */

const DEFAULT_CONFIG = {
  endpoint: null,
  storageKey: 'website-brief:v1',
  steps: ['business', 'name', 'goal', 'logo', 'colors', 'style', 'pages', 'photos', 'notes', 'contact'],
  secondsPerStep: 12,

  businessTypes: [
    { id: 'restaurante', icon: '🍽️', label: 'Restaurante o café', pages: ['menu', 'galeria', 'testimonios', 'reservas'], examples: ['Comida casera hecha con amor', 'El mejor café de la ciudad'] },
    { id: 'belleza', icon: '💅', label: 'Belleza o spa', pages: ['servicios', 'precios', 'galeria', 'reservas'], examples: ['Uñas y belleza con estilo', 'Tu momento de relajarte'] },
    { id: 'tienda', icon: '🛍️', label: 'Tienda o productos', pages: ['tienda', 'sobre', 'testimonios', 'faq'], examples: ['Productos únicos hechos a mano', 'Todo lo que necesitas, a domicilio'] },
    { id: 'profesional', icon: '💼', label: 'Servicios profesionales', pages: ['servicios', 'sobre', 'testimonios', 'faq'], examples: ['Asesoría contable para emprendedores', 'Soluciones legales claras y rápidas'] },
    { id: 'salud', icon: '🩺', label: 'Salud o bienestar', pages: ['servicios', 'sobre', 'testimonios', 'reservas'], examples: ['Cuidamos de ti y tu familia', 'Entrena, mejora, vive mejor'] },
    { id: 'hogar', icon: '🔨', label: 'Construcción u hogar', pages: ['servicios', 'galeria', 'testimonios', 'precios'], examples: ['Remodelaciones de calidad, a tiempo', 'Limpieza profesional para tu hogar'] },
    { id: 'creativo', icon: '🎨', label: 'Creativo o portafolio', pages: ['galeria', 'sobre', 'servicios', 'testimonios'], examples: ['Fotografía que cuenta historias', 'Diseño que hace crecer marcas'] },
    { id: 'eventos', icon: '🎉', label: 'Eventos', pages: ['servicios', 'galeria', 'precios', 'testimonios'], examples: ['Eventos inolvidables de principio a fin', 'Celebra a lo grande'] },
    { id: 'otro', icon: '✏️', label: 'Otro', pages: ['servicios', 'sobre', 'testimonios'], examples: [] },
  ],

  goals: [
    { id: 'contacto', icon: '📞', label: 'Que me llamen o escriban', cta: 'Contáctanos', page: 'contacto' },
    { id: 'citas', icon: '📅', label: 'Que agenden citas', cta: 'Agenda tu cita', page: 'reservas' },
    { id: 'vender', icon: '🛒', label: 'Vender en línea', cta: 'Compra ahora', page: 'tienda' },
    { id: 'mostrar', icon: '🖼️', label: 'Mostrar mi trabajo', cta: 'Ver trabajos', page: 'galeria' },
    { id: 'informar', icon: '📣', label: 'Dar a conocer mi negocio', cta: 'Conócenos', page: 'sobre' },
  ],

  // [primario, secundario, acento, fondo, texto]
  palettes: [
    { id: 'oceano', label: 'Océano', colors: ['#0284c7', '#0c4a6e', '#f59e0b', '#ffffff', '#0f172a'] },
    { id: 'bosque', label: 'Bosque', colors: ['#15803d', '#14532d', '#eab308', '#fafaf5', '#1c1917'] },
    { id: 'atardecer', label: 'Atardecer', colors: ['#ea580c', '#9a3412', '#facc15', '#fffbf5', '#1c1917'] },
    { id: 'rosa', label: 'Rosa', colors: ['#db2777', '#831843', '#f9a8d4', '#fff7fb', '#1f1020'] },
    { id: 'lavanda', label: 'Lavanda', colors: ['#7c3aed', '#4c1d95', '#22d3ee', '#faf8ff', '#1e1b2e'] },
    { id: 'lujo', label: 'Negro y oro', colors: ['#1c1917', '#a8803f', '#c8a25a', '#faf8f5', '#1c1917'] },
    { id: 'tierra', label: 'Tierra', colors: ['#a16207', '#57534e', '#65a30d', '#fdfaf3', '#292524'] },
    { id: 'noche', label: 'Noche', colors: ['#818cf8', '#c7d2fe', '#f472b6', '#0f172a', '#f1f5f9'] },
  ],

  styles: [
    { id: 'moderno', label: 'Moderno', description: 'Limpio, simple, mucho espacio', font: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif', weight: 700, radius: 10, align: 'left' },
    { id: 'elegante', label: 'Elegante', description: 'Sofisticado, refinado, de lujo', font: '"Didot", "Bodoni MT", Georgia, serif', weight: 400, radius: 0, align: 'center', tracking: '.02em' },
    { id: 'divertido', label: 'Divertido', description: 'Alegre, colorido, cercano', font: '"Trebuchet MS", "Avenir Next Rounded", system-ui, sans-serif', weight: 800, radius: 24, align: 'center' },
    { id: 'profesional', label: 'Profesional', description: 'Serio, confiable, corporativo', font: '"Helvetica Neue", Arial, sans-serif', weight: 600, radius: 4, align: 'left' },
    { id: 'audaz', label: 'Audaz', description: 'Llamativo, fuerte, con impacto', font: '"Arial Black", "Helvetica Neue", Impact, sans-serif', weight: 900, radius: 0, align: 'left', upper: true },
    { id: 'natural', label: 'Natural', description: 'Cálido, orgánico, artesanal', font: 'Georgia, "Times New Roman", serif', weight: 600, radius: 18, align: 'center' },
  ],

  pages: [
    { id: 'inicio', label: 'Inicio', locked: true },
    { id: 'servicios', label: 'Servicios' },
    { id: 'menu', label: 'Menú' },
    { id: 'tienda', label: 'Tienda' },
    { id: 'galeria', label: 'Galería' },
    { id: 'sobre', label: 'Sobre nosotros' },
    { id: 'testimonios', label: 'Testimonios' },
    { id: 'precios', label: 'Precios' },
    { id: 'reservas', label: 'Reservas' },
    { id: 'faq', label: 'Preguntas frecuentes' },
    { id: 'blog', label: 'Blog' },
    { id: 'contacto', label: 'Contacto' },
  ],

  copy: {
    business: { title: '¿Qué tipo de negocio tienes?', sub: 'Empecemos por lo fácil: toca una opción.' },
    name: { title: '¿Cómo se llama tu negocio?', sub: 'Así aparecerá en tu sitio. Puedes cambiarlo cuando quieras.' },
    goal: { title: '¿Qué quieres que logre la web de {name}?', sub: 'Elige lo más importante. Diseñaremos todo alrededor de esto.' },
    logo: { title: '¿Tienes logo?', sub: 'Si lo subes, tomamos sus colores automáticamente.' },
    colors: { title: '¿Qué colores te gustan?', sub: 'Mira cómo cambia la vista previa. No lo pienses mucho.' },
    style: { title: '¿Qué estilo va más con {name}?', sub: 'Confía en tu primera impresión.' },
    pages: { title: '¿Qué secciones necesitas?', sub: 'Ya marcamos las recomendadas para ti. Ajusta solo si quieres.' },
    photos: { title: '¿Tienes fotos de tu negocio?', sub: 'Las fotos reales generan confianza. Si no tienes, usamos imágenes profesionales.' },
    notes: { title: '¿Algo más que debamos saber?', sub: 'Opcional. Una web que te guste, tus servicios, horarios, ideas…' },
    contact: { title: '¡Último paso! ¿A dónde te enviamos tu sitio?', sub: 'Sin compromiso. Solo lo usamos para enviarte tu web.' },
    done: { title: '¡Listo, {contactName}!', sub: 'Ya tenemos todo para crear el sitio de {name}. Te lo enviaremos muy pronto.' },
    next: 'Continuar',
    back: 'Atrás',
    skip: 'Saltar',
    decideForMe: 'Decide por mí',
    submit: 'Crear mi sitio web',
    sending: 'Enviando…',
    saveAndReturn: 'Guardar y volver',
    restart: 'Empezar otro',
    resumed: 'Retomamos donde lo dejaste.',
    startOver: 'Empezar de nuevo',
    preview: 'Vista previa de tu sitio',
    showPreview: 'Ver cómo va tu sitio',
    hidePreview: 'Ocultar vista previa',
    lastStep: 'Último paso',
    remaining: '≈ {n} min',
    remainingSeconds: 'Menos de 1 min',
    yourAnswers: 'Tus respuestas',
    edit: 'Editar',
    errorName: 'Escribe el nombre de tu negocio para continuar.',
    errorOther: 'Cuéntanos qué tipo de negocio es.',
    errorContact: 'Necesitamos tu nombre y un correo o WhatsApp para enviarte tu sitio.',
    errorEmail: 'Revisa tu correo, parece que tiene un error.',
    errorSubmit: 'No pudimos enviar tu solicitud. Inténtalo de nuevo.',
  },
};

const STYLES = `
  :host {
    --wb-primary: #4f46e5;
    --wb-primary-text: #ffffff;
    --wb-bg: #ffffff;
    --wb-surface: #f6f7fb;
    --wb-text: #0f172a;
    --wb-muted: #64748b;
    --wb-border: #e5e7eb;
    --wb-danger: #dc2626;
    --wb-radius: 16px;
    --wb-font: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    display: block;
    font-family: var(--wb-font);
    color: var(--wb-text);
  }
  * { box-sizing: border-box; }
  button { font: inherit; color: inherit; }
  .shell { container-type: inline-size; }
  .frame {
    display: grid; grid-template-columns: minmax(0, 1fr);
    background: var(--wb-bg); border: 1px solid var(--wb-border);
    border-radius: var(--wb-radius); overflow: hidden;
  }
  .main { display: flex; flex-direction: column; padding: 24px; min-height: 540px; }

  .top { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; min-height: 36px; }
  .icon-btn {
    flex: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer;
    border: 1px solid var(--wb-border); background: var(--wb-bg); display: grid; place-items: center;
  }
  .icon-btn[hidden] { visibility: hidden; display: grid; }
  .bar { flex: 1; height: 6px; border-radius: 3px; background: var(--wb-border); overflow: hidden; }
  .bar i { display: block; height: 100%; background: var(--wb-primary); border-radius: 3px; transition: width .4s ease; }
  .eta { flex: none; font-size: .8rem; color: var(--wb-muted); min-width: 4.5em; text-align: right; }

  .banner {
    display: flex; justify-content: space-between; align-items: center; gap: 8px;
    font-size: .85rem; padding: 8px 12px; margin: -8px 0 16px; border-radius: 10px;
    background: color-mix(in srgb, var(--wb-primary) 8%, var(--wb-bg));
  }
  .link { background: none; border: 0; padding: 0; color: var(--wb-primary); cursor: pointer; font-weight: 600; text-decoration: underline; text-underline-offset: 2px; }

  .step { flex: 1; display: flex; flex-direction: column; }
  .step.enter-fwd { animation: in-fwd .28s ease both; }
  .step.enter-back { animation: in-back .28s ease both; }
  @keyframes in-fwd { from { opacity: 0; transform: translateX(16px); } }
  @keyframes in-back { from { opacity: 0; transform: translateX(-16px); } }
  @media (prefers-reduced-motion: reduce) { .step.enter-fwd, .step.enter-back { animation: none; } .bar i { transition: none; } }

  h2 { margin: 0 0 6px; font-size: clamp(1.3rem, 4.5cqi, 1.7rem); line-height: 1.2; outline: none; text-wrap: balance; }
  .sub { margin: 0 0 22px; color: var(--wb-muted); text-wrap: pretty; }

  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
  .grid.wide { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
  .opt {
    position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 8px;
    padding: 16px; min-height: 92px; text-align: left; cursor: pointer;
    background: var(--wb-surface); border: 2px solid transparent; border-radius: 14px;
    transition: border-color .15s, background .15s, transform .1s;
  }
  .opt.row { flex-direction: row; align-items: center; min-height: 0; padding: 14px 16px; }
  .opt:hover { border-color: var(--wb-border); }
  .opt:active { transform: scale(.98); }
  .opt[aria-pressed="true"] { border-color: var(--wb-primary); background: color-mix(in srgb, var(--wb-primary) 7%, var(--wb-bg)); }
  .opt[aria-pressed="true"]::after {
    content: "✓"; position: absolute; top: 8px; right: 10px; width: 20px; height: 20px; border-radius: 50%;
    display: grid; place-items: center; font-size: 12px; font-weight: 700;
    background: var(--wb-primary); color: var(--wb-primary-text);
  }
  .opt .emoji { font-size: 1.6rem; line-height: 1; }
  .opt strong { font-weight: 600; }
  .opt small { color: var(--wb-muted); }

  .field { display: block; margin-bottom: 16px; }
  .field > span { display: block; font-size: .9rem; font-weight: 600; margin-bottom: 6px; }
  .field > span em { font-weight: 400; font-style: normal; color: var(--wb-muted); }
  input[type="text"], input[type="email"], input[type="tel"], input[type="url"], textarea {
    width: 100%; padding: 13px 14px; font: inherit; color: inherit; background: var(--wb-bg);
    border: 1.5px solid var(--wb-border); border-radius: 12px; transition: border-color .15s;
  }
  input.big { font-size: 1.2rem; padding: 15px 16px; }
  textarea { min-height: 96px; resize: vertical; }
  input:focus, textarea:focus { border-color: var(--wb-primary); outline: none; }
  button:focus-visible, .drop:focus-within { outline: 2px solid var(--wb-primary); outline-offset: 2px; }

  .chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .chip {
    padding: 9px 14px; border-radius: 999px; cursor: pointer; font-size: .92rem;
    background: var(--wb-surface); border: 1.5px solid transparent;
  }
  .chip[aria-pressed="true"] { border-color: var(--wb-primary); background: color-mix(in srgb, var(--wb-primary) 8%, var(--wb-bg)); font-weight: 600; }
  .chip[aria-pressed="true"]::before { content: "✓ "; color: var(--wb-primary); }
  .chip:disabled { cursor: default; opacity: .75; }
  .chip.ghost { background: none; border: 1.5px dashed var(--wb-border); color: var(--wb-muted); }
  .hint { font-size: .85rem; color: var(--wb-muted); margin: 0 0 8px; }

  .drop {
    position: relative; display: grid; place-items: center; text-align: center; gap: 6px;
    padding: 24px; border: 2px dashed var(--wb-border); border-radius: 14px; cursor: pointer;
    background: var(--wb-surface); transition: border-color .15s, background .15s;
  }
  .drop.over, .drop:hover { border-color: var(--wb-primary); background: color-mix(in srgb, var(--wb-primary) 5%, var(--wb-bg)); }
  .drop input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  .drop .big-icon { font-size: 2rem; }
  .drop small { color: var(--wb-muted); }
  .or { display: flex; align-items: center; gap: 12px; color: var(--wb-muted); font-size: .85rem; margin: 16px 0; }
  .or::before, .or::after { content: ""; flex: 1; height: 1px; background: var(--wb-border); }

  .logo-box { display: flex; align-items: center; gap: 16px; padding: 16px; border-radius: 14px; background: var(--wb-surface); }
  .logo-box img { width: 72px; height: 72px; object-fit: contain; background: #fff; border-radius: 10px; padding: 6px; border: 1px solid var(--wb-border); }
  .logo-box .swatches { margin-top: 6px; }

  .swatches { display: flex; gap: 4px; }
  .swatches i { width: 18px; height: 18px; border-radius: 50%; border: 1px solid rgba(0,0,0,.1); }
  .palette { display: flex; flex-direction: column; gap: 10px; }
  .palette .strip { display: flex; height: 36px; width: 100%; border-radius: 8px; overflow: hidden; border: 1px solid rgba(0,0,0,.08); }
  .palette .strip i { flex: 1; }
  .palette .strip i:first-child { flex: 2; }
  .custom-colors { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 14px; }
  .custom-colors label { display: flex; align-items: center; gap: 8px; font-size: .9rem; }
  .custom-colors input { width: 44px; height: 36px; padding: 0; border: 1px solid var(--wb-border); border-radius: 8px; background: none; cursor: pointer; }

  .style-opt { padding: 10px; gap: 10px; }
  .style-opt .mock { --fs: 6.5px; width: 100%; pointer-events: none; box-shadow: none; }

  .thumbs { display: grid; grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); gap: 8px; margin-top: 12px; }
  .thumbs figure { position: relative; margin: 0; aspect-ratio: 1; border-radius: 10px; overflow: hidden; background: var(--wb-surface); }
  .thumbs img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .thumbs button {
    position: absolute; top: 4px; right: 4px; width: 24px; height: 24px; border-radius: 50%; border: 0;
    background: rgba(0,0,0,.6); color: #fff; cursor: pointer; font-size: 14px; line-height: 1;
  }

  .review { margin: 0 0 18px; border: 1px solid var(--wb-border); border-radius: 12px; }
  .review summary { cursor: pointer; padding: 12px 14px; font-weight: 600; font-size: .9rem; }
  .review ul { list-style: none; margin: 0; padding: 0 14px 8px; }
  .review li { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 8px 0; border-top: 1px solid var(--wb-border); font-size: .9rem; }
  .review li span:first-child { color: var(--wb-muted); flex: none; }
  .review li span:nth-child(2) { flex: 1; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .trust { display: flex; gap: 8px; align-items: center; font-size: .82rem; color: var(--wb-muted); margin-top: 4px; }

  .error { color: var(--wb-danger); font-size: .9rem; min-height: 1.3em; margin: 12px 0 0; }
  .shake { animation: shake .35s; }
  @keyframes shake { 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }

  .footer { display: flex; align-items: center; gap: 16px; margin-top: auto; padding-top: 20px; }
  .btn {
    padding: 14px 26px; border-radius: 12px; border: 0; cursor: pointer; font-weight: 700; font-size: 1rem;
    background: var(--wb-primary); color: var(--wb-primary-text); transition: transform .1s, filter .15s;
  }
  .btn:hover { filter: brightness(1.08); }
  .btn:active { transform: scale(.98); }
  .btn:disabled { opacity: .6; cursor: wait; }
  .btn.full { width: 100%; }
  .skip { background: none; border: 0; padding: 8px; cursor: pointer; color: var(--wb-muted); font-weight: 600; }
  .skip:hover { color: var(--wb-text); }
  .kbd { font-size: .78rem; color: var(--wb-muted); }

  .pv-toggle {
    display: flex; justify-content: center; align-items: center; gap: 8px; width: 100%;
    padding: 12px; margin-top: 16px; border: 1px solid var(--wb-border); border-radius: 12px;
    background: var(--wb-surface); cursor: pointer; font-weight: 600; font-size: .9rem;
  }
  .pv { display: none; flex-direction: column; gap: 12px; padding: 24px; background: var(--wb-surface); border-top: 1px solid var(--wb-border); }
  .pv.open { display: flex; }
  .pv-inner { display: flex; flex-direction: column; gap: 12px; }
  .pv-label { font-size: .75rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--wb-muted); }

  @container (min-width: 820px) {
    .frame { grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); }
    .main { padding: 36px 40px; min-height: 600px; }
    .pv { display: flex; justify-content: center; border-top: 0; border-left: 1px solid var(--wb-border); padding: 36px; }
    .pv-toggle { display: none; }
    .pv-inner { position: sticky; top: 24px; }
  }

  .done { text-align: center; align-items: center; justify-content: center; }
  .done .badge {
    width: 64px; height: 64px; border-radius: 50%; display: grid; place-items: center; font-size: 30px; margin-bottom: 16px;
    background: color-mix(in srgb, var(--wb-primary) 12%, var(--wb-bg));
    animation: pop .5s cubic-bezier(.2,1.6,.4,1) both;
  }
  @keyframes pop { from { transform: scale(.4); opacity: 0; } }

  /* ---------- Mini sitio de vista previa ---------- */
  .mock {
    font-size: var(--fs, 12px); font-family: var(--ff); background: var(--bg); color: var(--tx);
    border-radius: 10px; overflow: hidden; border: 1px solid rgba(0,0,0,.08);
    box-shadow: 0 10px 30px -12px rgba(15,23,42,.25); transition: background .3s, color .3s;
  }
  .mock-chrome { display: flex; gap: 5px; padding: 8px 10px; background: #e9ebef; }
  .mock-chrome i { width: 8px; height: 8px; border-radius: 50%; background: #c9ccd3; }
  .mock-chrome span { flex: 1; margin-left: 8px; height: 8px; border-radius: 4px; background: #fff; max-width: 60%; }
  .mock-nav { display: flex; justify-content: space-between; align-items: center; gap: 1em; padding: 1em 1.4em; }
  .mock-logo {
    font-weight: var(--fw); color: var(--p); text-transform: var(--tt); letter-spacing: var(--ls);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 55%;
  }
  .mock-logo img { height: 2em; max-width: 8em; object-fit: contain; display: block; }
  .mock-links { display: flex; gap: .7em; }
  .mock-links i { width: 2.6em; height: .5em; border-radius: 1em; background: currentColor; opacity: .22; }
  .mock-hero {
    padding: 2.6em 1.6em 3em; text-align: var(--al);
    background: color-mix(in srgb, var(--p) 10%, var(--bg)) center / cover no-repeat;
  }
  .mock-hero.photo { color: #fff; }
  .mock-h1 {
    font-size: 2.1em; line-height: 1.1; font-weight: var(--fw); text-transform: var(--tt);
    letter-spacing: var(--ls); overflow-wrap: anywhere;
  }
  .mock-sub { margin: .7em 0 1.4em; opacity: .78; }
  .mock-btn {
    display: inline-block; padding: .8em 1.5em; border-radius: var(--r); font-weight: 700;
    background: var(--p); color: var(--on); transition: background .3s;
  }
  .mock-secs { display: grid; grid-template-columns: repeat(3, 1fr); gap: .8em; padding: 1.4em; }
  .mock-sec {
    padding: .9em .8em 1.4em; border-radius: var(--r); font-weight: 600; font-size: .9em;
    background: color-mix(in srgb, var(--s) 7%, var(--bg)); border-top: .25em solid var(--a);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .mock-sec::after { content: ""; display: block; height: .4em; width: 70%; margin-top: .7em; border-radius: 1em; background: currentColor; opacity: .15; }
`;

// ---------- Utilidades ----------

const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const fill = (tpl, vars) => String(tpl).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

const hexToRgb = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgbToHex = (r, g, b) => '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const textOn = (hex) => (luminance(hex) > 0.45 ? '#111111' : '#ffffff');
const colorDistance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
/** ¿c es una mezcla de p con el color base (blanco/negro)? Detecta bordes suavizados. */
const isBlend = (c, p, base) => {
  const d = p.map((v, i) => v - base[i]);
  const len2 = d.reduce((sum, v) => sum + v * v, 0);
  if (!len2) return false;
  const t = c.reduce((sum, v, i) => sum + (v - base[i]) * d[i], 0) / len2;
  if (t <= 0 || t >= 1) return false;
  return colorDistance(c, base.map((v, i) => v + d[i] * t)) < 30;
};
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

const readFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

/** Reduce imágenes grandes para no cargar archivos enormes en memoria ni en el envío. */
async function downscale(file, max, type = 'image/jpeg') {
  const dataUrl = await readFile(file);
  if (/svg|gif/.test(file.type)) return dataUrl;
  try {
    const img = await loadImage(dataUrl);
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    if (scale === 1 && file.size < 1.5e6) return dataUrl;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL(type, 0.85);
  } catch {
    return dataUrl;
  }
}

/** Obtiene hasta 3 colores dominantes de una imagen, ignorando fondos blancos/negros. */
async function extractColors(dataUrl) {
  try {
    const img = await loadImage(dataUrl);
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data;
    const buckets = new Map();
    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
      if (a < 128) continue;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const light = (max + min) / 510;
      if (light > 0.93 || light < 0.06) continue;
      const sat = max ? (max - min) / max : 0;
      const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
      const entry = buckets.get(key) || { r: 0, g: 0, b: 0, n: 0, w: 0 };
      entry.r += r; entry.g += g; entry.b += b; entry.n += 1; entry.w += 1 + sat * 2;
      buckets.set(key, entry);
    }
    const picked = [];
    const counted = [...buckets.values()].reduce((sum, e) => sum + e.n, 0);
    [...buckets.values()]
      .filter((e) => e.n >= counted * 0.02) // descarta tonos de borde/antialiasing
      .sort((a, b) => b.w - a.w)
      .forEach((e) => {
        const rgb = [e.r / e.n, e.g / e.n, e.b / e.n];
        const distinct = picked.every(
          (p) => colorDistance(p, rgb) > 70 && !isBlend(rgb, p, [255, 255, 255]) && !isBlend(rgb, p, [0, 0, 0])
        );
        if (picked.length < 3 && distinct) picked.push(rgb);
      });
    return picked.map((c) => rgbToHex(...c));
  } catch {
    return [];
  }
}

const mergeConfig = (custom = {}) => {
  const merged = { ...DEFAULT_CONFIG, ...custom, copy: { ...DEFAULT_CONFIG.copy } };
  Object.entries(custom.copy || {}).forEach(([k, v]) => {
    merged.copy[k] = typeof v === 'object' ? { ...DEFAULT_CONFIG.copy[k], ...v } : v;
  });
  return merged;
};

const emptyData = () => ({
  business: null,
  businessOther: '',
  name: '',
  tagline: '',
  goal: null,
  logo: { mode: null, dataUrl: null, fileName: null, colors: [] },
  colors: { mode: null, paletteId: null, custom: ['#4f46e5', '#1e1b4b', '#f59e0b'] },
  style: null,
  pages: null,
  photos: { mode: null, items: [] },
  notes: { url: '', text: '' },
  contact: { name: '', email: '', phone: '', domain: '' },
});

// ---------- Componente ----------

class WebsiteBrief extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = mergeConfig();
    this._customConfig = null;
    this._resetState();
    this.shadowRoot.addEventListener('click', (e) => this._onClick(e));
    this.shadowRoot.addEventListener('input', (e) => this._onInput(e));
    this.shadowRoot.addEventListener('change', (e) => this._onChange(e));
    this.shadowRoot.addEventListener('keydown', (e) => this._onKeydown(e));
    this.shadowRoot.addEventListener('dragover', (e) => this._onDrag(e, true));
    this.shadowRoot.addEventListener('dragleave', (e) => this._onDrag(e, false));
    this.shadowRoot.addEventListener('drop', (e) => this._onDrop(e));
  }

  connectedCallback() {
    this._loadConfig();
  }

  get config() {
    return this._config;
  }

  set config(value) {
    this._customConfig = value;
    this._config = mergeConfig(value);
    if (this.isConnected) this.reset();
  }

  /** Respuestas actuales (útil para depurar o integrar). */
  get answers() {
    return structuredClone(this._data);
  }

  /** Reinicia el flujo y borra el progreso guardado. */
  reset() {
    this._clearSaved();
    this._resetState();
    this._renderShell();
  }

  _resetState() {
    this._data = emptyData();
    this._index = 0;
    this._done = false;
    this._sending = false;
    this._error = '';
    this._direction = 'fwd';
    this._returnToEnd = false;
    this._resumed = false;
    this._previewOpen = false;
    this._interacted = false;
  }

  async _loadConfig() {
    if (!this._customConfig) {
      const src = this.getAttribute('config-src');
      const inline = this.querySelector('script[type="application/json"]');
      try {
        if (src) this._config = mergeConfig(await (await fetch(src)).json());
        else if (inline) this._config = mergeConfig(JSON.parse(inline.textContent));
      } catch (err) {
        console.error('[website-brief] No se pudo cargar la configuración:', err);
      }
    }
    this._restore();
    this._renderShell();
  }

  // ---------- Persistencia ----------

  get _persist() {
    return !this.hasAttribute('no-persist');
  }

  _save() {
    if (!this._persist || this._done) return;
    const data = { ...this._data, photos: { mode: this._data.photos.mode, items: [] } };
    const store = (d) => localStorage.setItem(this._config.storageKey, JSON.stringify({ index: this._index, data: d }));
    try {
      store(data);
    } catch {
      try {
        store({ ...data, logo: { ...data.logo, dataUrl: null } });
      } catch {
        /* almacenamiento no disponible */
      }
    }
  }

  _restore() {
    if (!this._persist) return;
    try {
      const saved = JSON.parse(localStorage.getItem(this._config.storageKey));
      if (saved?.data && saved.index > 0) {
        this._data = { ...emptyData(), ...saved.data };
        this._index = Math.min(saved.index, this._steps.length - 1);
        this._resumed = true;
      }
    } catch {
      /* almacenamiento no disponible */
    }
  }

  _clearSaved() {
    try {
      localStorage.removeItem(this._config.storageKey);
    } catch {
      /* almacenamiento no disponible */
    }
  }

  // ---------- Datos derivados ----------

  get _steps() {
    return this._config.steps;
  }

  get _step() {
    return this._steps[this._index];
  }

  get _business() {
    return this._config.businessTypes.find((b) => b.id === this._data.business);
  }

  get _goal() {
    return this._config.goals.find((g) => g.id === this._data.goal);
  }

  get _styleDef() {
    return this._config.styles.find((s) => s.id === this._data.style) || this._config.styles[0];
  }

  get _displayName() {
    return this._data.name.trim() || 'tu negocio';
  }

  /** Colores efectivos: [primario, secundario, acento, fondo, texto]. */
  get _colors() {
    const { colors, logo } = this._data;
    if (colors.mode === 'palette') {
      const p = this._config.palettes.find((x) => x.id === colors.paletteId);
      if (p) return p.colors;
    }
    if (colors.mode === 'logo' && logo.colors.length) return this._paletteFromLogo(logo.colors);
    if (colors.mode === 'custom') return [...colors.custom, '#ffffff', '#111827'];
    if (logo.colors.length) return this._paletteFromLogo(logo.colors);
    return ['#4f46e5', '#1e1b4b', '#f59e0b', '#ffffff', '#111827'];
  }

  _paletteFromLogo(c) {
    return [c[0], c[1] || c[0], c[2] || c[1] || c[0], '#ffffff', '#111827'];
  }

  /** Secciones recomendadas según tipo de negocio y objetivo. */
  _defaultPages() {
    const set = new Set(['inicio', ...(this._business?.pages || ['servicios', 'sobre']), 'contacto']);
    if (this._goal?.page) set.add(this._goal.page);
    const valid = this._config.pages.map((p) => p.id);
    return valid.filter((id) => set.has(id));
  }

  get _pages() {
    return this._data.pages || this._defaultPages();
  }

  _vars() {
    return { name: this._displayName, contactName: this._data.contact.name.trim().split(' ')[0] || '' };
  }

  // ---------- Navegación ----------

  _validate() {
    const { copy } = this._config;
    const d = this._data;
    switch (this._step) {
      case 'business':
        if (!d.business) return ' ';
        if (d.business === 'otro' && !d.businessOther.trim()) return copy.errorOther;
        return '';
      case 'name':
        return d.name.trim() ? '' : copy.errorName;
      case 'contact': {
        const { name, email, phone } = d.contact;
        if (!name.trim() || (!email.trim() && !phone.trim())) return copy.errorContact;
        if (email.trim() && !isEmail(email.trim())) return copy.errorEmail;
        return '';
      }
      default:
        return '';
    }
  }

  _next() {
    const error = this._validate();
    this._error = error.trim();
    if (error) return this._showError();
    if (this._step === 'pages' && !this._data.pages) this._data.pages = this._defaultPages();
    if (this._index === this._steps.length - 1) return this._submit();
    const target = this._returnToEnd ? this._steps.length - 1 : this._index + 1;
    this._returnToEnd = false;
    this._goTo(target, 'fwd');
  }

  _back() {
    if (this._index === 0) return;
    this._returnToEnd = false;
    this._goTo(this._index - 1, 'back');
  }

  _goTo(index, direction) {
    this._index = index;
    this._direction = direction;
    this._error = '';
    this._resumed = false;
    this._interacted = true;
    this._save();
    this._renderMain();
    this._renderPreview();
    this._emit('wb:step', { step: this._step, index });
  }

  _showError() {
    const err = this.shadowRoot.querySelector('.error');
    if (err) {
      err.textContent = this._error;
      err.classList.remove('shake');
      void err.offsetWidth;
      err.classList.add('shake');
    }
  }

  /** Avanza solo tras un toque, con una pausa breve para que se vea la selección. */
  _autoAdvance() {
    clearTimeout(this._advanceTimer);
    this._advanceTimer = setTimeout(() => this._next(), 260);
  }

  _emit(name, detail, cancelable = false) {
    return this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true, cancelable }));
  }

  // ---------- Resultado ----------

  _brief() {
    const d = this._data;
    const [primary, secondary, accent, background, text] = this._colors;
    const colorsDecided = d.colors.mode && d.colors.mode !== 'auto';
    return {
      business: {
        type: d.business,
        typeLabel: d.business === 'otro' ? d.businessOther.trim() : this._business?.label,
        name: d.name.trim(),
        tagline: d.tagline.trim(),
      },
      goal: d.goal ? { id: d.goal, label: this._goal?.label, cta: this._goal?.cta } : 'auto',
      logo: d.logo.mode === 'upload' && d.logo.dataUrl ? 'provided' : d.logo.mode || 'auto',
      colors: colorsDecided ? { source: d.colors.mode, primary, secondary, accent, background, text } : 'auto',
      style: d.style && d.style !== 'auto' ? { id: d.style, label: this._styleDef.label, description: this._styleDef.description } : 'auto',
      pages: this._pages.map((id) => this._config.pages.find((p) => p.id === id)?.label || id),
      photos: d.photos.items.length ? 'provided' : 'stock',
      inspirationUrl: d.notes.url.trim(),
      notes: d.notes.text.trim(),
      domain: d.contact.domain.trim(),
      contact: { name: d.contact.name.trim(), email: d.contact.email.trim(), phone: d.contact.phone.trim() },
    };
  }

  /** Instrucciones listas para enviarle a la IA que construye el sitio. */
  _prompt(b) {
    const lines = [
      `Crea un sitio web completo en español para "${b.business.name}", un negocio de ${(b.business.typeLabel || 'servicios').toLowerCase()}.`,
    ];
    if (b.business.tagline) lines.push(`Descripción / eslogan: "${b.business.tagline}".`);
    lines.push(
      b.goal === 'auto'
        ? 'Objetivo principal: elige el más adecuado para este tipo de negocio.'
        : `Objetivo principal del sitio: ${b.goal.label.toLowerCase()}. El botón principal debe decir "${b.goal.cta}".`
    );
    lines.push(
      {
        provided: 'Logo: usa el logo proporcionado.',
        create: 'Logo: el cliente no tiene logo; crea un logotipo simple y profesional.',
        text: 'Logo: usa el nombre del negocio como logotipo de texto.',
        auto: 'Logo: usa el nombre del negocio como logotipo de texto.',
      }[b.logo]
    );
    lines.push(
      b.colors === 'auto'
        ? 'Colores: elige una paleta apropiada para el tipo de negocio y el estilo.'
        : `Colores: primario ${b.colors.primary}, secundario ${b.colors.secondary}, acento ${b.colors.accent}, fondo ${b.colors.background}, texto ${b.colors.text}.`
    );
    lines.push(
      b.style === 'auto'
        ? 'Estilo visual: elige el más adecuado para el negocio.'
        : `Estilo visual: ${b.style.label.toLowerCase()} (${b.style.description.toLowerCase()}).`
    );
    lines.push(`Secciones: ${b.pages.join(', ')}.`);
    lines.push(
      b.photos === 'provided'
        ? 'Fotos: usa las fotos proporcionadas por el cliente.'
        : `Fotos: usa fotos de stock profesionales relacionadas con ${(b.business.typeLabel || 'el negocio').toLowerCase()}.`
    );
    if (b.inspirationUrl) lines.push(`Sitio de referencia que le gusta al cliente: ${b.inspirationUrl}`);
    if (b.notes) lines.push(`Notas del cliente: ${b.notes}`);
    if (b.domain) lines.push(`Dominio: ${b.domain}`);
    lines.push('El sitio debe ser responsive, rápido, accesible y optimizado para SEO local.');
    return lines.join('\n');
  }

  _payload() {
    const brief = this._brief();
    const { logo, photos } = this._data;
    return {
      brief,
      prompt: this._prompt(brief),
      assets: {
        logo: logo.mode === 'upload' && logo.dataUrl ? { name: logo.fileName, dataUrl: logo.dataUrl } : null,
        photos: photos.items.map(({ name, dataUrl }) => ({ name, dataUrl })),
      },
      createdAt: new Date().toISOString(),
    };
  }

  async _submit() {
    const payload = this._payload();
    const proceed = this._emit('wb:submit', payload, true);
    const endpoint = this.getAttribute('endpoint') || this._config.endpoint;

    if (proceed && endpoint) {
      this._sending = true;
      this._renderMain();
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const response = await res.json().catch(() => null);
        this._emit('wb:success', { payload, response });
      } catch (error) {
        this._sending = false;
        this._error = this._config.copy.errorSubmit;
        this._renderMain();
        this._emit('wb:error', { payload, error });
        return;
      }
    }

    this._sending = false;
    this._done = true;
    this._clearSaved();
    this._direction = 'fwd';
    this._renderMain();
    this._renderPreview();
  }

  // ---------- Archivos ----------

  async _handleLogo(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const dataUrl = await downscale(file, 1000, 'image/png');
    const colors = await extractColors(dataUrl);
    this._data.logo = { mode: 'upload', dataUrl, fileName: file.name, colors };
    if (colors.length && (!this._data.colors.mode || this._data.colors.mode === 'auto')) {
      this._data.colors.mode = 'logo';
    }
    this._afterChange(true);
  }

  async _handlePhotos(files) {
    const room = 10 - this._data.photos.items.length;
    const images = [...files].filter((f) => f.type.startsWith('image/')).slice(0, room);
    for (const file of images) {
      const dataUrl = await downscale(file, 1600);
      this._data.photos.items.push({ name: file.name, dataUrl });
    }
    if (this._data.photos.items.length) this._data.photos.mode = 'upload';
    this._afterChange(true);
  }

  _afterChange(rerenderStep = false) {
    this._save();
    if (rerenderStep) {
      this._direction = null;
      this._renderMain();
    }
    this._renderPreview();
  }

  // ---------- Eventos ----------

  _onClick(e) {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const { action, value } = el.dataset;
    const d = this._data;

    switch (action) {
      case 'next':
        return this._next();
      case 'back':
        return this._back();
      case 'goto':
        this._returnToEnd = true;
        return this._goTo(this._steps.indexOf(value), 'back');
      case 'start-over':
        return this.reset();
      case 'toggle-preview': {
        const { copy } = this._config;
        this._previewOpen = !this._previewOpen;
        this.shadowRoot.querySelector('.pv').classList.toggle('open', this._previewOpen);
        el.setAttribute('aria-expanded', this._previewOpen);
        el.textContent = this._previewOpen ? '🙈 ' + copy.hidePreview : '👀 ' + copy.showPreview;
        return;
      }
      case 'business':
        d.business = value;
        this._afterChange(true);
        if (value !== 'otro') this._autoAdvance();
        else this.shadowRoot.querySelector('[data-bind="businessOther"]')?.focus();
        return;
      case 'tagline':
        d.tagline = value;
        this._afterChange(true);
        return;
      case 'goal':
        d.goal = value;
        this._afterChange(true);
        return this._autoAdvance();
      case 'skip':
        if (this._step === 'goal') d.goal = null;
        if (this._step === 'colors') d.colors.mode = 'auto';
        if (this._step === 'style') d.style = 'auto';
        if (this._step === 'logo' && !d.logo.dataUrl) d.logo.mode = 'text';
        if (this._step === 'photos' && !d.photos.items.length) d.photos.mode = 'stock';
        this._save();
        return this._next();
      case 'logo-mode':
        d.logo = { ...d.logo, mode: value };
        this._afterChange(true);
        return this._autoAdvance();
      case 'logo-remove':
        d.logo = { mode: null, dataUrl: null, fileName: null, colors: [] };
        if (d.colors.mode === 'logo') d.colors.mode = null;
        return this._afterChange(true);
      case 'palette':
        d.colors.mode = 'palette';
        d.colors.paletteId = value;
        return this._afterChange(true);
      case 'color-mode':
        d.colors.mode = value;
        return this._afterChange(true);
      case 'style':
        d.style = value;
        this._afterChange(true);
        return this._autoAdvance();
      case 'page': {
        const pages = new Set(this._pages);
        pages.has(value) ? pages.delete(value) : pages.add(value);
        d.pages = this._config.pages.map((p) => p.id).filter((id) => pages.has(id));
        return this._afterChange(true);
      }
      case 'pages-reset':
        d.pages = null;
        return this._afterChange(true);
      case 'photo-remove':
        d.photos.items.splice(Number(value), 1);
        if (!d.photos.items.length) d.photos.mode = null;
        return this._afterChange(true);
      case 'stock':
        d.photos.mode = 'stock';
        this._afterChange(true);
        return this._autoAdvance();
    }
  }

  _onInput(e) {
    const el = e.target;
    if (el.dataset.bind) {
      const path = el.dataset.bind.split('.');
      let obj = this._data;
      while (path.length > 1) obj = obj[path.shift()];
      obj[path[0]] = el.value;
      if (this._error) {
        this._error = '';
        const err = this.shadowRoot.querySelector('.error');
        if (err) err.textContent = '';
      }
      this._save();
      this._renderPreview();
    } else if (el.dataset.custom != null) {
      this._data.colors.custom[Number(el.dataset.custom)] = el.value;
      this._data.colors.mode = 'custom';
      this._save();
      this._renderPreview();
    }
  }

  _onChange(e) {
    const el = e.target;
    if (el.dataset.file === 'logo') this._handleLogo(el.files[0]);
    if (el.dataset.file === 'photos') this._handlePhotos(el.files);
    if (el.dataset.custom != null) this._afterChange(true);
  }

  _onKeydown(e) {
    if (e.key === 'Enter' && e.target.matches('input[type="text"], input[type="email"], input[type="tel"], input[type="url"]')) {
      e.preventDefault();
      this._next();
    }
  }

  _onDrag(e, over) {
    const drop = e.target.closest?.('.drop');
    if (!drop) return;
    e.preventDefault();
    drop.classList.toggle('over', over);
  }

  _onDrop(e) {
    const drop = e.target.closest?.('.drop');
    if (!drop) return;
    e.preventDefault();
    drop.classList.remove('over');
    const files = e.dataTransfer?.files;
    if (!files?.length) return;
    if (drop.dataset.kind === 'logo') this._handleLogo(files[0]);
    else this._handlePhotos(files);
  }

  // ---------- Render ----------

  _renderShell() {
    const { copy } = this._config;
    this.shadowRoot.innerHTML = `
      <style>${STYLES}</style>
      <div class="shell">
        <div class="frame" part="frame">
          <section class="main" part="main"></section>
          <aside class="pv ${this._previewOpen ? 'open' : ''}" part="preview" aria-label="${esc(copy.preview)}"></aside>
        </div>
      </div>`;
    this._renderMain();
    this._renderPreview();
  }

  _renderMain() {
    const main = this.shadowRoot.querySelector('.main');
    if (!main) return;
    // Al re-renderizar el mismo paso, conservar el foco en el control que se usó.
    const active = this.shadowRoot.activeElement;
    const keep = !this._direction && active?.dataset?.action ? `[data-action="${active.dataset.action}"]${active.dataset.value ? `[data-value="${CSS.escape(active.dataset.value)}"]` : ''}` : null;
    main.innerHTML = this._done ? this._renderDone() : this._renderTop() + this._renderStep();

    const step = main.querySelector('.step');
    if (step && this._direction) step.classList.add(`enter-${this._direction}`);
    if (keep) main.querySelector(keep)?.focus({ preventScroll: true });

    // Solo mover el foco tras una acción del usuario, para no hacer saltar la página al cargar.
    if (this._interacted && this._direction) {
      const target = main.querySelector('[autofocus]') || main.querySelector('h2');
      target?.focus({ preventScroll: true });
      const top = this.getBoundingClientRect().top;
      if (top < 0) this.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  _renderTop() {
    const { copy } = this._config;
    const total = this._steps.length;
    // Progreso ligeramente adelantado al inicio: se siente avance desde el primer toque.
    const progress = Math.round(Math.sqrt((this._index + 0.5) / total) * 100);
    const remainingSec = (total - this._index) * this._config.secondsPerStep;
    const eta =
      this._index === total - 1
        ? copy.lastStep
        : remainingSec < 60
          ? copy.remainingSeconds
          : fill(copy.remaining, { n: Math.round(remainingSec / 60) });

    return `
      <div class="top">
        <button class="icon-btn" data-action="back" aria-label="${esc(copy.back)}" ${this._index === 0 ? 'hidden' : ''}>←</button>
        <div class="bar" role="progressbar" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"><i style="width:${progress}%"></i></div>
        <span class="eta">${esc(eta)}</span>
      </div>
      ${
        this._resumed
          ? `<div class="banner"><span>${esc(copy.resumed)}</span><button class="link" data-action="start-over">${esc(copy.startOver)}</button></div>`
          : ''
      }`;
  }

  _renderStep() {
    const { copy } = this._config;
    const text = copy[this._step] || {};
    const vars = this._vars();
    const body = this[`_step_${this._step}`]?.() ?? { html: '' };

    const nextLabel = this._sending
      ? copy.sending
      : this._index === this._steps.length - 1
        ? copy.submit
        : this._returnToEnd
          ? copy.saveAndReturn
          : copy.next;

    return `
      <div class="step">
        <h2 tabindex="-1">${esc(fill(text.title, vars))}</h2>
        <p class="sub">${esc(fill(text.sub, vars))}</p>
        ${body.html}
        <p class="error" role="alert">${esc(this._error)}</p>
        ${
          body.noNext && !body.skip
            ? ''
            : `<div class="footer">
                ${body.noNext ? '' : `<button class="btn ${this._step === 'contact' ? 'full' : ''}" data-action="next" ${this._sending ? 'disabled' : ''}>${esc(nextLabel)}${this._step === 'contact' ? ' ✨' : ''}</button>`}
                ${body.skip ? `<button class="skip" data-action="skip">${esc(body.skip)}</button>` : ''}
              </div>`
        }
        <button class="pv-toggle" data-action="toggle-preview" aria-expanded="${this._previewOpen}">
          ${this._previewOpen ? '🙈 ' + esc(copy.hidePreview) : '👀 ' + esc(copy.showPreview)}
        </button>
      </div>`;
  }

  // Cada paso devuelve { html, skip?, noNext? }

  _step_business() {
    const d = this._data;
    const options = this._config.businessTypes
      .map(
        (b) => `<button class="opt" data-action="business" data-value="${esc(b.id)}" aria-pressed="${d.business === b.id}">
          <span class="emoji" aria-hidden="true">${b.icon}</span><strong>${esc(b.label)}</strong>
        </button>`
      )
      .join('');
    const other =
      d.business === 'otro'
        ? `<label class="field" style="margin-top:16px"><span>¿Qué tipo de negocio es?</span>
            <input type="text" data-bind="businessOther" value="${esc(d.businessOther)}" placeholder="Ej. taller mecánico, escuela de música…" autofocus /></label>`
        : '';
    return { html: `<div class="grid" role="group">${options}</div>${other}`, noNext: d.business !== 'otro' };
  }

  _step_name() {
    const d = this._data;
    const examples = this._business?.examples || [];
    return {
      html: `
        <label class="field"><span>Nombre del negocio</span>
          <input class="big" type="text" data-bind="name" value="${esc(d.name)}" placeholder="Ej. Luna Café" autocomplete="organization" autofocus /></label>
        <label class="field"><span>Descríbelo en una frase <em>(opcional)</em></span>
          <input type="text" data-bind="tagline" value="${esc(d.tagline)}" placeholder="Lo que haces y para quién" /></label>
        ${
          examples.length
            ? `<p class="hint">¿Sin ideas? Toca una:</p><div class="chips">${examples
                .map((ex) => `<button class="chip ghost" data-action="tagline" data-value="${esc(ex)}">${esc(ex)}</button>`)
                .join('')}</div>`
            : ''
        }`,
    };
  }

  _step_goal() {
    const d = this._data;
    const options = this._config.goals
      .map(
        (g) => `<button class="opt row" data-action="goal" data-value="${esc(g.id)}" aria-pressed="${d.goal === g.id}">
          <span class="emoji" aria-hidden="true">${g.icon}</span><strong>${esc(g.label)}</strong>
        </button>`
      )
      .join('');
    return { html: `<div class="grid wide" role="group">${options}</div>`, noNext: !d.goal, skip: this._config.copy.decideForMe };
  }

  _step_logo() {
    const { logo } = this._data;
    if (logo.mode === 'upload' && logo.dataUrl) {
      return {
        html: `
          <div class="logo-box">
            <img src="${logo.dataUrl}" alt="Tu logo" />
            <div>
              <strong>¡Se ve genial!</strong>
              ${
                logo.colors.length
                  ? `<div class="hint" style="margin:4px 0 0">Tomamos estos colores de tu logo:</div>
                     <div class="swatches">${logo.colors.map((c) => `<i style="background:${c}"></i>`).join('')}</div>`
                  : ''
              }
              <div style="margin-top:8px"><button class="link" data-action="logo-remove">Cambiar logo</button></div>
            </div>
          </div>`,
      };
    }
    return {
      html: `
        <label class="drop" data-kind="logo">
          <input type="file" accept="image/*" data-file="logo" aria-label="Subir logo" />
          <span class="big-icon" aria-hidden="true">⬆️</span>
          <strong>Sube tu logo</strong>
          <small>Arrastra aquí o toca para elegir · PNG, JPG o SVG</small>
        </label>
        <div class="or">o</div>
        <div class="grid wide" role="group">
          <button class="opt row" data-action="logo-mode" data-value="create" aria-pressed="${logo.mode === 'create'}">
            <span class="emoji" aria-hidden="true">✨</span><span><strong>No tengo, créenme uno</strong></span>
          </button>
          <button class="opt row" data-action="logo-mode" data-value="text" aria-pressed="${logo.mode === 'text'}">
            <span class="emoji" aria-hidden="true">🔤</span><span><strong>Usen solo el nombre</strong></span>
          </button>
        </div>`,
      noNext: true,
    };
  }

  _step_colors() {
    const { colors, logo } = this._data;
    const swatch = (list) => `<div class="strip">${list.slice(0, 3).map((c) => `<i style="background:${c}"></i>`).join('')}</div>`;
    const logoOpt = logo.colors.length
      ? `<button class="opt palette" data-action="color-mode" data-value="logo" aria-pressed="${colors.mode === 'logo'}">
          ${swatch(this._paletteFromLogo(logo.colors))}<strong>De mi logo</strong></button>`
      : '';
    const palettes = this._config.palettes
      .map(
        (p) => `<button class="opt palette" data-action="palette" data-value="${esc(p.id)}" aria-pressed="${colors.mode === 'palette' && colors.paletteId === p.id}">
          ${swatch(p.colors)}<strong>${esc(p.label)}</strong></button>`
      )
      .join('');
    const custom = `<button class="opt palette" data-action="color-mode" data-value="custom" aria-pressed="${colors.mode === 'custom'}">
        <div class="strip" style="background:conic-gradient(from 90deg,#f43f5e,#f59e0b,#22c55e,#06b6d4,#6366f1,#d946ef,#f43f5e)"></div><strong>Elegir mis colores</strong></button>`;
    const pickers =
      colors.mode === 'custom'
        ? `<div class="custom-colors">${['Principal', 'Secundario', 'Acento']
            .map((l, i) => `<label><input type="color" data-custom="${i}" value="${colors.custom[i]}" />${l}</label>`)
            .join('')}</div>`
        : '';
    return { html: `<div class="grid" role="group">${logoOpt}${palettes}${custom}</div>${pickers}`, skip: this._config.copy.decideForMe };
  }

  _step_style() {
    const d = this._data;
    const options = this._config.styles
      .map(
        (s) => `<button class="opt style-opt" data-action="style" data-value="${esc(s.id)}" aria-pressed="${d.style === s.id}">
          ${this._mock(s, { compact: true })}
          <span><strong>${esc(s.label)}</strong><br /><small>${esc(s.description)}</small></span>
        </button>`
      )
      .join('');
    return { html: `<div class="grid wide" role="group">${options}</div>`, noNext: !d.style || d.style === 'auto', skip: this._config.copy.decideForMe };
  }

  _step_pages() {
    const selected = this._pages;
    const chips = this._config.pages
      .map(
        (p) => `<button class="chip" data-action="page" data-value="${esc(p.id)}" aria-pressed="${selected.includes(p.id)}" ${p.locked ? 'disabled' : ''}>${esc(p.label)}</button>`
      )
      .join('');
    return {
      html: `<div class="chips" role="group">${chips}</div>
        ${this._data.pages ? `<p class="hint" style="margin-top:14px"><button class="link" data-action="pages-reset">Volver a las recomendadas</button></p>` : ''}`,
    };
  }

  _step_photos() {
    const { photos } = this._data;
    const thumbs = photos.items.length
      ? `<div class="thumbs">${photos.items
          .map((p, i) => `<figure><img src="${p.dataUrl}" alt="" /><button data-action="photo-remove" data-value="${i}" aria-label="Quitar foto">×</button></figure>`)
          .join('')}</div>`
      : '';
    return {
      html: `
        <label class="drop" data-kind="photos">
          <input type="file" accept="image/*" multiple data-file="photos" aria-label="Subir fotos" />
          <span class="big-icon" aria-hidden="true">📷</span>
          <strong>${photos.items.length ? 'Agregar más fotos' : 'Sube tus fotos'}</strong>
          <small>Local, productos, equipo, trabajos… hasta 10</small>
        </label>
        ${thumbs}
        ${
          photos.items.length
            ? ''
            : `<div class="or">o</div>
               <button class="opt row" style="width:100%" data-action="stock" aria-pressed="${photos.mode === 'stock'}">
                 <span class="emoji" aria-hidden="true">🖼️</span><span><strong>Usen fotos profesionales</strong><br /><small>Elegimos imágenes de calidad para tu negocio</small></span>
               </button>`
        }`,
      noNext: !photos.items.length,
    };
  }

  _step_notes() {
    const { notes } = this._data;
    return {
      html: `
        <label class="field"><span>Una web que te guste <em>(opcional)</em></span>
          <input type="url" data-bind="notes.url" value="${esc(notes.url)}" placeholder="https://…" inputmode="url" /></label>
        <label class="field"><span>Cuéntanos lo que quieras <em>(opcional)</em></span>
          <textarea data-bind="notes.text" placeholder="Tus servicios y precios, horarios, dirección, redes sociales, ideas…">${esc(notes.text)}</textarea></label>`,
      skip: this._config.copy.skip,
    };
  }

  _step_contact() {
    const { contact } = this._data;
    return {
      html: `
        ${this._renderReview()}
        <label class="field"><span>Tu nombre</span>
          <input type="text" data-bind="contact.name" value="${esc(contact.name)}" autocomplete="name" autofocus /></label>
        <label class="field"><span>Correo electrónico</span>
          <input type="email" data-bind="contact.email" value="${esc(contact.email)}" autocomplete="email" placeholder="tu@correo.com" /></label>
        <label class="field"><span>WhatsApp <em>(opcional si dejas tu correo)</em></span>
          <input type="tel" data-bind="contact.phone" value="${esc(contact.phone)}" autocomplete="tel" placeholder="+1 555 123 4567" /></label>
        <label class="field"><span>¿Ya tienes dominio? <em>(opcional)</em></span>
          <input type="text" data-bind="contact.domain" value="${esc(contact.domain)}" placeholder="minegocio.com" autocapitalize="off" /></label>
        <div class="trust">🔒 Tus datos están seguros. Nunca los compartimos.</div>`,
    };
  }

  _renderReview() {
    const { copy } = this._config;
    const d = this._data;
    const b = this._brief();
    const rows = [
      ['business', 'Negocio', b.business.typeLabel],
      ['name', 'Nombre', b.business.name],
      ['goal', 'Objetivo', b.goal === 'auto' ? copy.decideForMe : b.goal.label],
      ['logo', 'Logo', { provided: 'Subido', create: 'Crear uno', text: 'Solo el nombre', auto: copy.decideForMe }[b.logo]],
      ['colors', 'Colores', b.colors === 'auto' ? copy.decideForMe : `<span class="swatches" style="justify-content:flex-end">${this._colors.slice(0, 3).map((c) => `<i style="background:${c}"></i>`).join('')}</span>`],
      ['style', 'Estilo', b.style === 'auto' ? copy.decideForMe : b.style.label],
      ['pages', 'Secciones', String(b.pages.length)],
      ['photos', 'Fotos', d.photos.items.length ? String(d.photos.items.length) : 'Profesionales'],
    ].filter(([step]) => this._steps.includes(step));

    return `<details class="review"><summary>${esc(copy.yourAnswers)}</summary><ul>
      ${rows
        .map(
          ([step, label, value]) => `<li><span>${esc(label)}</span><span>${step === 'colors' && b.colors !== 'auto' ? value : esc(value || '—')}</span>
            <button class="link" data-action="goto" data-value="${step}">${esc(copy.edit)}</button></li>`
        )
        .join('')}
    </ul></details>`;
  }

  _renderDone() {
    const { copy } = this._config;
    const vars = this._vars();
    return `
      <div class="step done enter-fwd">
        <div class="badge" aria-hidden="true">🎉</div>
        <h2 tabindex="-1">${esc(fill(copy.done.title, vars))}</h2>
        <p class="sub">${esc(fill(copy.done.sub, vars))}</p>
        <button class="skip" data-action="start-over">${esc(copy.restart)}</button>
      </div>`;
  }

  _renderPreview() {
    const pv = this.shadowRoot.querySelector('.pv');
    if (!pv) return;
    pv.innerHTML = `<div class="pv-inner"><div class="pv-label">${esc(this._config.copy.preview)}</div>${this._mock(this._styleDef)}</div>`;
  }

  /** Mini maqueta del sitio con los colores, estilo, logo, nombre y secciones elegidos. */
  _mock(style, { compact = false } = {}) {
    const d = this._data;
    const [p, s, a, bg, tx] = this._colors;
    const vars = [
      `--p:${p}`, `--s:${s}`, `--a:${a}`, `--bg:${bg}`, `--tx:${tx}`, `--on:${textOn(p)}`,
      `--ff:${style.font}`, `--fw:${style.weight}`, `--r:${style.radius}px`, `--al:${style.align}`,
      `--tt:${style.upper ? 'uppercase' : 'none'}`, `--ls:${style.tracking || 'normal'}`,
    ].join(';');

    const name = d.name.trim() || 'Tu negocio';
    const tagline = d.tagline.trim() || this._business?.examples?.[0] || 'Aquí va lo que hace especial a tu negocio';
    const cta = this._goal?.cta || 'Contáctanos';
    const photo = d.photos.items[0]?.dataUrl;
    const logo = d.logo.mode === 'upload' && d.logo.dataUrl ? `<img src="${d.logo.dataUrl}" alt="" />` : esc(name);
    const sections = this._pages
      .filter((id) => id !== 'inicio')
      .slice(0, 6)
      .map((id) => `<div class="mock-sec">${esc(this._config.pages.find((x) => x.id === id)?.label || id)}</div>`)
      .join('');

    return `
      <div class="mock" style="${esc(vars)}" aria-hidden="true">
        ${compact ? '' : '<div class="mock-chrome"><i></i><i></i><i></i><span></span></div>'}
        <div class="mock-nav"><span class="mock-logo">${logo}</span><span class="mock-links"><i></i><i></i><i></i></span></div>
        <div class="mock-hero ${photo ? 'photo' : ''}" ${photo ? `style="background-image:linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45)),url(${photo})"` : ''}>
          <div class="mock-h1">${esc(name)}</div>
          <div class="mock-sub">${esc(tagline)}</div>
          <span class="mock-btn">${esc(cta)}</span>
        </div>
        ${compact ? '' : `<div class="mock-secs">${sections}</div>`}
      </div>`;
  }
}

if (!customElements.get('website-brief')) {
  customElements.define('website-brief', WebsiteBrief);
}

export { WebsiteBrief, DEFAULT_CONFIG };
