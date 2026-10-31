/**
 * <flow-of-services> — componente web embebible para un flujo de solicitud de servicios.
 *
 * Pasos: servicio → fecha/hora → datos de contacto → resumen → confirmación.
 * Sin dependencias. Estilos aislados con Shadow DOM y personalizables con variables CSS.
 *
 * Configuración (cualquiera de estas, en orden de prioridad):
 *   1. Propiedad JS:          el.config = { ... }
 *   2. Archivo JSON externo:  <flow-of-services config-src="servicios.json">
 *   3. JSON en línea:         <flow-of-services><script type="application/json">{...}</script></flow-of-services>
 *
 * Atributos opcionales:
 *   endpoint="https://..."  URL a la que se envía el resultado por POST (JSON).
 *
 * Eventos (se pueden escuchar desde la página):
 *   fos:step     detail: { step, index }
 *   fos:submit   detail: payload  (cancelable: preventDefault() evita el envío al endpoint)
 *   fos:success  detail: { payload, response }
 *   fos:error    detail: { payload, error }
 */

const DEFAULT_CONFIG = {
  title: 'Solicita tu servicio',
  locale: 'es-MX',
  currency: 'USD',
  multiple: false,
  steps: ['service', 'schedule', 'details', 'summary'],
  services: [
    { id: 'basico', name: 'Servicio básico', description: 'Atención estándar.', price: 25, duration: 30 },
    { id: 'completo', name: 'Servicio completo', description: 'Incluye todo lo del básico y más.', price: 45, duration: 60 },
    { id: 'premium', name: 'Servicio premium', description: 'La experiencia más completa.', price: 70, duration: 90 },
  ],
  schedule: {
    days: 14,
    start: '09:00',
    end: '18:00',
    interval: 60,
    closedWeekdays: [0], // 0 = domingo
  },
  fields: [
    { name: 'name', label: 'Nombre completo', type: 'text', required: true },
    { name: 'email', label: 'Correo electrónico', type: 'email', required: true },
    { name: 'phone', label: 'Teléfono', type: 'tel', required: false },
    { name: 'notes', label: 'Comentarios', type: 'textarea', required: false },
  ],
  labels: {
    service: 'Servicio',
    schedule: 'Fecha y hora',
    details: 'Tus datos',
    summary: 'Resumen',
    next: 'Continuar',
    back: 'Atrás',
    submit: 'Confirmar solicitud',
    sending: 'Enviando…',
    restart: 'Hacer otra solicitud',
    total: 'Total',
    noSlots: 'No hay horarios disponibles para este día.',
    pickService: 'Elige un servicio para continuar.',
    pickSlot: 'Elige fecha y hora para continuar.',
    required: 'Completa los campos obligatorios.',
    successTitle: '¡Solicitud enviada!',
    successText: 'Te contactaremos pronto para confirmar.',
    errorText: 'No se pudo enviar la solicitud. Inténtalo de nuevo.',
  },
};

const STYLES = `
  :host {
    --fos-primary: #2563eb;
    --fos-primary-text: #ffffff;
    --fos-bg: #ffffff;
    --fos-surface: #f8fafc;
    --fos-text: #0f172a;
    --fos-muted: #64748b;
    --fos-border: #e2e8f0;
    --fos-danger: #dc2626;
    --fos-radius: 12px;
    --fos-font: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    display: block;
    max-width: 560px;
    font-family: var(--fos-font);
    color: var(--fos-text);
  }
  * { box-sizing: border-box; }
  .card {
    background: var(--fos-bg);
    border: 1px solid var(--fos-border);
    border-radius: var(--fos-radius);
    padding: 24px;
  }
  h2 { margin: 0 0 16px; font-size: 1.25rem; }
  h3 { margin: 0 0 12px; font-size: 1rem; }
  .progress { display: flex; gap: 6px; margin-bottom: 20px; }
  .progress span {
    flex: 1; height: 4px; border-radius: 2px; background: var(--fos-border);
  }
  .progress span.on { background: var(--fos-primary); }
  .step-label { color: var(--fos-muted); font-size: .8rem; margin-bottom: 4px; }
  .options { display: grid; gap: 10px; }
  .option {
    display: flex; justify-content: space-between; gap: 12px; align-items: flex-start;
    text-align: left; width: 100%; padding: 14px; cursor: pointer;
    background: var(--fos-surface); color: inherit; font: inherit;
    border: 2px solid transparent; border-radius: calc(var(--fos-radius) - 4px);
  }
  .option:hover { border-color: var(--fos-border); }
  .option[aria-pressed="true"] { border-color: var(--fos-primary); }
  .option small { display: block; color: var(--fos-muted); margin-top: 2px; }
  .price { font-weight: 600; white-space: nowrap; }
  .chips { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; margin-bottom: 16px; }
  .chips.wrap { flex-wrap: wrap; overflow: visible; }
  .chip {
    flex: none; padding: 8px 12px; cursor: pointer; font: inherit; color: inherit;
    background: var(--fos-surface); border: 2px solid transparent; border-radius: 999px;
  }
  .chip[aria-pressed="true"] { border-color: var(--fos-primary); }
  .chip:disabled { opacity: .4; cursor: not-allowed; }
  label { display: block; font-size: .9rem; margin-bottom: 12px; }
  label span { display: block; margin-bottom: 4px; }
  input, textarea {
    width: 100%; padding: 10px 12px; font: inherit; color: inherit;
    background: var(--fos-bg); border: 1px solid var(--fos-border);
    border-radius: calc(var(--fos-radius) - 6px);
  }
  textarea { min-height: 80px; resize: vertical; }
  input:focus, textarea:focus, button:focus-visible {
    outline: 2px solid var(--fos-primary); outline-offset: 1px;
  }
  .summary { list-style: none; padding: 0; margin: 0 0 12px; }
  .summary li {
    display: flex; justify-content: space-between; gap: 12px;
    padding: 8px 0; border-bottom: 1px solid var(--fos-border);
  }
  .summary li span:first-child { color: var(--fos-muted); }
  .summary li.total { font-weight: 600; border-bottom: 0; }
  .summary li.total span:first-child { color: inherit; }
  .error { color: var(--fos-danger); font-size: .9rem; min-height: 1.2em; margin: 8px 0 0; }
  .actions { display: flex; justify-content: space-between; gap: 10px; margin-top: 16px; }
  .btn {
    padding: 10px 18px; font: inherit; font-weight: 600; cursor: pointer;
    border-radius: calc(var(--fos-radius) - 4px); border: 1px solid var(--fos-border);
    background: var(--fos-bg); color: inherit;
  }
  .btn.primary { background: var(--fos-primary); color: var(--fos-primary-text); border-color: var(--fos-primary); margin-left: auto; }
  .btn:disabled { opacity: .6; cursor: wait; }
  .done { text-align: center; padding: 12px 0; }
  .done .icon {
    width: 48px; height: 48px; margin: 0 auto 12px; border-radius: 50%;
    display: grid; place-items: center; font-size: 24px;
    background: var(--fos-primary); color: var(--fos-primary-text);
  }
  .done p { color: var(--fos-muted); }
`;

const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const toHHMM = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

const isoDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const mergeConfig = (custom = {}) => ({
  ...DEFAULT_CONFIG,
  ...custom,
  schedule: { ...DEFAULT_CONFIG.schedule, ...(custom.schedule || {}) },
  labels: { ...DEFAULT_CONFIG.labels, ...(custom.labels || {}) },
});

class FlowOfServices extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = mergeConfig();
    this._customConfig = null;
    this._resetState();
  }

  connectedCallback() {
    this._loadConfig();
  }

  /** Configuración actual (ya combinada con los valores por defecto). */
  get config() {
    return this._config;
  }

  set config(value) {
    this._customConfig = value;
    this._config = mergeConfig(value);
    this.reset();
  }

  /** Reinicia el flujo al primer paso. */
  reset() {
    this._resetState();
    this._render();
  }

  _resetState() {
    this._index = 0;
    this._done = false;
    this._sending = false;
    this._error = '';
    this._data = { services: [], date: null, time: null, fields: {} };
  }

  async _loadConfig() {
    if (this._customConfig) return this._render();

    const src = this.getAttribute('config-src');
    const inline = this.querySelector('script[type="application/json"]');
    try {
      if (src) {
        const res = await fetch(src);
        this._config = mergeConfig(await res.json());
      } else if (inline) {
        this._config = mergeConfig(JSON.parse(inline.textContent));
      }
    } catch (err) {
      console.error('[flow-of-services] No se pudo cargar la configuración:', err);
    }
    this._render();
  }

  get _steps() {
    return this._config.steps;
  }

  get _step() {
    return this._steps[this._index];
  }

  get _selectedServices() {
    return this._config.services.filter((s) => this._data.services.includes(s.id));
  }

  _formatPrice(amount) {
    const { locale, currency } = this._config;
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  }

  _formatDate(iso, options) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(this._config.locale, options);
  }

  _availableDays() {
    const { days, closedWeekdays } = this._config.schedule;
    const result = [];
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    for (let i = 0; result.length < days && i < days * 2; i++) {
      if (!closedWeekdays.includes(day.getDay())) result.push(isoDate(day));
      day.setDate(day.getDate() + 1);
    }
    return result;
  }

  _slotsFor(iso) {
    const { start, end, interval } = this._config.schedule;
    const now = new Date();
    const isToday = iso === isoDate(now);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const slots = [];
    for (let t = toMinutes(start); t < toMinutes(end); t += interval) {
      slots.push({ time: toHHMM(t), disabled: isToday && t <= nowMinutes });
    }
    return slots;
  }

  _validate() {
    const { labels, fields } = this._config;
    switch (this._step) {
      case 'service':
        return this._data.services.length ? '' : labels.pickService;
      case 'schedule':
        return this._data.date && this._data.time ? '' : labels.pickSlot;
      case 'details': {
        const form = this.shadowRoot.querySelector('form');
        const missing = fields.some((f) => f.required && !String(this._data.fields[f.name] || '').trim());
        if (missing || (form && !form.checkValidity())) {
          form?.reportValidity();
          return labels.required;
        }
        return '';
      }
      default:
        return '';
    }
  }

  _go(delta) {
    if (delta > 0) {
      this._error = this._validate();
      if (this._error) return this._render();
    } else {
      this._error = '';
    }
    this._index = Math.max(0, Math.min(this._steps.length - 1, this._index + delta));
    this._render();
    this._emit('fos:step', { step: this._step, index: this._index });
  }

  _emit(name, detail, cancelable = false) {
    return this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true, cancelable }));
  }

  _payload() {
    const services = this._selectedServices;
    return {
      services: services.map(({ id, name, price, duration }) => ({ id, name, price, duration })),
      total: services.reduce((sum, s) => sum + (Number(s.price) || 0), 0),
      currency: this._config.currency,
      date: this._data.date,
      time: this._data.time,
      contact: { ...this._data.fields },
      createdAt: new Date().toISOString(),
    };
  }

  async _submit() {
    const payload = this._payload();
    const proceed = this._emit('fos:submit', payload, true);
    const endpoint = this.getAttribute('endpoint') || this._config.endpoint;

    if (!proceed || !endpoint) {
      this._done = true;
      return this._render();
    }

    this._sending = true;
    this._error = '';
    this._render();
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const response = await res.json().catch(() => null);
      this._done = true;
      this._emit('fos:success', { payload, response });
    } catch (error) {
      this._error = this._config.labels.errorText;
      this._emit('fos:error', { payload, error });
    } finally {
      this._sending = false;
      this._render();
    }
  }

  // ---------- Render ----------

  _render() {
    const { title, labels } = this._config;
    const body = this._done ? this._renderDone() : this._renderStep();
    const progress = this._done
      ? ''
      : `<div class="progress" aria-hidden="true">${this._steps
          .map((_, i) => `<span class="${i <= this._index ? 'on' : ''}"></span>`)
          .join('')}</div>`;

    this.shadowRoot.innerHTML = `
      <style>${STYLES}</style>
      <div class="card" part="card">
        ${progress}
        ${this._done ? '' : `<div class="step-label">${this._index + 1} / ${this._steps.length} · ${esc(labels[this._step])}</div>`}
        <h2 part="title">${esc(title)}</h2>
        ${body}
      </div>
    `;
    this._bind();
  }

  _renderStep() {
    const { labels } = this._config;
    const isLast = this._index === this._steps.length - 1;
    const content = {
      service: () => this._renderServices(),
      schedule: () => this._renderSchedule(),
      details: () => this._renderDetails(),
      summary: () => this._renderSummary(),
    }[this._step]?.() ?? '';

    return `
      ${content}
      <p class="error" role="alert">${esc(this._error)}</p>
      <div class="actions">
        ${this._index > 0 ? `<button class="btn" data-action="back" type="button">${esc(labels.back)}</button>` : ''}
        <button class="btn primary" data-action="${isLast ? 'submit' : 'next'}" type="button" ${this._sending ? 'disabled' : ''}>
          ${esc(this._sending ? labels.sending : isLast ? labels.submit : labels.next)}
        </button>
      </div>
    `;
  }

  _renderServices() {
    return `<div class="options" role="group" aria-label="${esc(this._config.labels.service)}">
      ${this._config.services
        .map(
          (s) => `
        <button class="option" type="button" data-service="${esc(s.id)}" aria-pressed="${this._data.services.includes(s.id)}">
          <span>
            <strong>${esc(s.name)}</strong>
            ${s.description ? `<small>${esc(s.description)}</small>` : ''}
            ${s.duration ? `<small>${esc(s.duration)} min</small>` : ''}
          </span>
          ${s.price != null ? `<span class="price">${esc(this._formatPrice(s.price))}</span>` : ''}
        </button>`
        )
        .join('')}
    </div>`;
  }

  _renderSchedule() {
    const days = this._availableDays();
    const selected = this._data.date;
    const slots = selected ? this._slotsFor(selected) : [];
    const available = slots.filter((s) => !s.disabled);

    return `
      <h3>${esc(this._config.labels.schedule)}</h3>
      <div class="chips" role="group">
        ${days
          .map(
            (d) => `<button class="chip" type="button" data-date="${d}" aria-pressed="${d === selected}">
              ${esc(this._formatDate(d, { weekday: 'short', day: 'numeric', month: 'short' }))}
            </button>`
          )
          .join('')}
      </div>
      ${
        selected
          ? available.length
            ? `<div class="chips wrap" role="group">${slots
                .map(
                  (s) => `<button class="chip" type="button" data-time="${s.time}" aria-pressed="${s.time === this._data.time}" ${s.disabled ? 'disabled' : ''}>${s.time}</button>`
                )
                .join('')}</div>`
            : `<p class="error">${esc(this._config.labels.noSlots)}</p>`
          : ''
      }
    `;
  }

  _renderDetails() {
    return `<form novalidate>
      ${this._config.fields
        .map((f) => {
          const value = esc(this._data.fields[f.name] || '');
          const attrs = `name="${esc(f.name)}" ${f.required ? 'required' : ''} ${f.placeholder ? `placeholder="${esc(f.placeholder)}"` : ''}`;
          const input =
            f.type === 'textarea'
              ? `<textarea ${attrs}>${value}</textarea>`
              : `<input type="${esc(f.type || 'text')}" ${attrs} value="${value}" />`;
          return `<label><span>${esc(f.label)}${f.required ? ' *' : ''}</span>${input}</label>`;
        })
        .join('')}
    </form>`;
  }

  _renderSummary() {
    const { labels, fields } = this._config;
    const p = this._payload();
    const rows = [];

    p.services.forEach((s) => rows.push([s.name, s.price != null ? this._formatPrice(s.price) : '']));
    if (p.date) {
      rows.push([labels.schedule, `${this._formatDate(p.date, { weekday: 'long', day: 'numeric', month: 'long' })} · ${p.time}`]);
    }
    fields.forEach((f) => {
      if (p.contact[f.name]) rows.push([f.label, p.contact[f.name]]);
    });

    return `<ul class="summary">
      ${rows.map(([k, v]) => `<li><span>${esc(k)}</span><span>${esc(v)}</span></li>`).join('')}
      <li class="total"><span>${esc(labels.total)}</span><span>${esc(this._formatPrice(p.total))}</span></li>
    </ul>`;
  }

  _renderDone() {
    const { labels } = this._config;
    return `<div class="done">
      <div class="icon" aria-hidden="true">✓</div>
      <h3>${esc(labels.successTitle)}</h3>
      <p>${esc(labels.successText)}</p>
      <button class="btn primary" style="margin:0 auto" data-action="restart" type="button">${esc(labels.restart)}</button>
    </div>`;
  }

  // ---------- Eventos internos ----------

  _bind() {
    const root = this.shadowRoot;

    root.querySelectorAll('[data-action]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'next') this._go(1);
        else if (action === 'back') this._go(-1);
        else if (action === 'submit') this._submit();
        else if (action === 'restart') this.reset();
      })
    );

    root.querySelectorAll('[data-service]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const id = btn.dataset.service;
        const list = this._data.services;
        if (this._config.multiple) {
          this._data.services = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
        } else {
          this._data.services = [id];
        }
        this._error = '';
        this._render();
      })
    );

    root.querySelectorAll('[data-date]').forEach((btn) =>
      btn.addEventListener('click', () => {
        this._data.date = btn.dataset.date;
        this._data.time = null;
        this._error = '';
        this._render();
      })
    );

    root.querySelectorAll('[data-time]').forEach((btn) =>
      btn.addEventListener('click', () => {
        this._data.time = btn.dataset.time;
        this._error = '';
        this._render();
      })
    );

    root.querySelectorAll('form [name]').forEach((input) =>
      input.addEventListener('input', () => {
        this._data.fields[input.name] = input.value;
      })
    );
  }
}

if (!customElements.get('flow-of-services')) {
  customElements.define('flow-of-services', FlowOfServices);
}

export { FlowOfServices };
