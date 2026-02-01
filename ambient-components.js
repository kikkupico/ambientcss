// ==========================================================================
// Ambient Components v0.1
// Skeuomorphic Web Components
//
// Realistic UI controls - knobs, faders, switches, buttons, indicators.
// Uses Ambient CSS custom properties for physically-based lighting.
// ==========================================================================

// --------------------------------------------------------------------------
// Base class for all ambient components
// --------------------------------------------------------------------------
class AmbientElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  // Shared styles that all components inherit
  // Uses the same lighting model as ambient.css
  static get baseStyles() {
    return `
      :host {
        display: inline-block;

        /* Light direction */
        --_lx: var(--amb-light-x, 1);
        --_ly: var(--amb-light-y, -1);

        /* Light intensity */
        --_key: var(--amb-key-light, 0.3);
        --_fill: var(--amb-fill-light, 0);

        /* Light color */
        --_light-r: var(--amb-light-r, 255);
        --_light-g: var(--amb-light-g, 255);
        --_light-b: var(--amb-light-b, 255);

        /* Edge treatments */
        --_fillet: var(--amb-fillet, 0);
        --_fillet-w: var(--amb-fillet-width, 1);
        --_chamfer: var(--amb-chamfer, 0);

        /* Elevation */
        --_elevation: var(--amb-elevation, 1);

        /* Accent color */
        --_accent: var(--amb-accent, rgb(255, 140, 50));
      }
    `;
  }
}

// --------------------------------------------------------------------------
// amb-knob - Rotary control
// --------------------------------------------------------------------------
class AmbKnob extends AmbientElement {
  static get observedAttributes() {
    return ['value', 'min', 'max', 'size', 'label'];
  }

  constructor() {
    super();
    this._value = 50;
    this._min = 0;
    this._max = 100;
    this._dragging = false;
    this._startY = 0;
    this._startValue = 0;
  }

  connectedCallback() {
    this.render();
    this.setupEvents();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    switch (name) {
      case 'value': this._value = parseFloat(newVal) || 0; break;
      case 'min': this._min = parseFloat(newVal) || 0; break;
      case 'max': this._max = parseFloat(newVal) || 100; break;
    }
    this.updateRotation();
  }

  get value() { return this._value; }
  set value(v) {
    this._value = Math.max(this._min, Math.min(this._max, v));
    this.setAttribute('value', this._value);
    this.updateRotation();
    this.dispatchEvent(new CustomEvent('change', { detail: { value: this._value } }));
  }

  updateRotation() {
    const rotator = this.shadowRoot?.querySelector('.knob-rotation');
    if (!rotator) return;
    const percent = (this._value - this._min) / (this._max - this._min);
    const rotation = (percent * 270) - 135;
    rotator.style.transform = `rotate(${rotation}deg)`;
  }

  setupEvents() {
    const knob = this.shadowRoot.querySelector('.knob');

    const onStart = (y) => {
      this._dragging = true;
      this._startY = y;
      this._startValue = this._value;
      knob.classList.add('grabbing');
    };

    const onMove = (y) => {
      if (!this._dragging) return;
      const delta = this._startY - y;
      const range = this._max - this._min;
      const sensitivity = range / 150;
      this.value = this._startValue + (delta * sensitivity);
    };

    const onEnd = () => {
      this._dragging = false;
      knob.classList.remove('grabbing');
    };

    knob.addEventListener('mousedown', (e) => { onStart(e.clientY); e.preventDefault(); });
    knob.addEventListener('touchstart', (e) => { onStart(e.touches[0].clientY); e.preventDefault(); });
    document.addEventListener('mousemove', (e) => onMove(e.clientY));
    document.addEventListener('touchmove', (e) => onMove(e.touches[0].clientY));
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchend', onEnd);
  }

  render() {
    const size = this.getAttribute('size') || 'medium';
    const label = this.getAttribute('label') || '';
    const sizeMap = { small: 40, medium: 52, large: 64 };
    const sz = sizeMap[size] || 52;

    this.shadowRoot.innerHTML = `
      <style>
        ${AmbientElement.baseStyles}
        :host {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .knob {
          width: ${sz}px;
          height: ${sz}px;
          border-radius: 50%;
          cursor: grab;
          position: relative;
          background: rgb(35, 35, 45);
          box-shadow:
            /* Drop shadow based on light direction */
            rgba(0, 0, 0, calc(var(--_key) - var(--_fill) + 0.2))
              calc(var(--_lx) * var(--_elevation) * -4px)
              calc(var(--_ly) * var(--_elevation) * -4px)
              calc(var(--_elevation) * 8px)
              0px,
            /* Highlight edge */
            inset
              calc(var(--_lx) * -1px)
              calc(var(--_ly) * -1px)
              2px 0px
              rgba(var(--_light-r), var(--_light-g), var(--_light-b), calc(var(--_key) * 0.3)),
            /* Shadow edge */
            inset
              calc(var(--_lx) * 1px)
              calc(var(--_ly) * 1px)
              2px 0px
              rgba(0, 0, 0, calc(var(--_key) * 0.5)),
            /* Brightness from key light */
            inset 0 0 0 100px rgba(var(--_light-r), var(--_light-g), var(--_light-b), calc(var(--_key) * 0.15));
        }
        .knob.grabbing { cursor: grabbing; }
        .knob-inner {
          position: absolute;
          top: 3px;
          left: 3px;
          right: 3px;
          bottom: 3px;
          border-radius: 50%;
          background: rgb(30, 30, 40);
          box-shadow:
            inset 0 2px 6px rgba(0, 0, 0, 0.5),
            inset 0 0 0 100px rgba(var(--_light-r), var(--_light-g), var(--_light-b), calc(var(--_key) * 0.1));
        }
        .knob-rotation {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }
        .knob-indicator {
          position: absolute;
          top: 5px;
          left: 50%;
          width: 3px;
          height: 8px;
          background: #fff;
          border-radius: 2px;
          transform: translateX(-50%);
          box-shadow: 0 0 4px rgba(255, 255, 255, 0.5);
        }
        .label {
          font-family: system-ui, sans-serif;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--amb-text-muted, #888);
        }
      </style>
      <div class="knob" part="knob">
        <div class="knob-inner" part="inner"></div>
        <div class="knob-rotation">
          <div class="knob-indicator" part="indicator"></div>
        </div>
      </div>
      ${label ? `<span class="label" part="label">${label}</span>` : ''}
    `;
    this.updateRotation();
  }
}

// --------------------------------------------------------------------------
// amb-fader - Linear slider control
// --------------------------------------------------------------------------
class AmbFader extends AmbientElement {
  static get observedAttributes() {
    return ['value', 'min', 'max', 'orientation', 'label'];
  }

  constructor() {
    super();
    this._value = 50;
    this._min = 0;
    this._max = 100;
    this._dragging = false;
  }

  connectedCallback() {
    this.render();
    this.setupEvents();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    switch (name) {
      case 'value': this._value = parseFloat(newVal) || 0; break;
      case 'min': this._min = parseFloat(newVal) || 0; break;
      case 'max': this._max = parseFloat(newVal) || 100; break;
    }
    this.updatePosition();
  }

  get value() { return this._value; }
  set value(v) {
    this._value = Math.max(this._min, Math.min(this._max, v));
    this.setAttribute('value', this._value);
    this.updatePosition();
    this.dispatchEvent(new CustomEvent('change', { detail: { value: this._value } }));
  }

  get isVertical() {
    return this.getAttribute('orientation') !== 'horizontal';
  }

  updatePosition() {
    const handle = this.shadowRoot?.querySelector('.handle');
    const fill = this.shadowRoot?.querySelector('.fill');
    if (!handle || !fill) return;

    const percent = ((this._value - this._min) / (this._max - this._min)) * 100;

    if (this.isVertical) {
      const inverted = 100 - percent;
      handle.style.top = `${inverted}%`;
      fill.style.height = `${percent}%`;
    } else {
      handle.style.left = `${percent}%`;
      fill.style.width = `${percent}%`;
    }
  }

  setupEvents() {
    const track = this.shadowRoot.querySelector('.track');

    const updateFromPosition = (clientX, clientY) => {
      const rect = track.getBoundingClientRect();
      let percent;

      if (this.isVertical) {
        percent = 1 - ((clientY - rect.top) / rect.height);
      } else {
        percent = (clientX - rect.left) / rect.width;
      }

      percent = Math.max(0, Math.min(1, percent));
      this.value = this._min + (percent * (this._max - this._min));
    };

    const onStart = (x, y) => {
      this._dragging = true;
      updateFromPosition(x, y);
    };

    const onMove = (x, y) => {
      if (!this._dragging) return;
      updateFromPosition(x, y);
    };

    const onEnd = () => {
      this._dragging = false;
    };

    track.addEventListener('mousedown', (e) => { onStart(e.clientX, e.clientY); e.preventDefault(); });
    track.addEventListener('touchstart', (e) => { onStart(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); });
    document.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
    document.addEventListener('touchmove', (e) => onMove(e.touches[0].clientX, e.touches[0].clientY));
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchend', onEnd);
  }

  render() {
    const label = this.getAttribute('label') || '';
    const isVert = this.isVertical;

    this.shadowRoot.innerHTML = `
      <style>
        ${AmbientElement.baseStyles}
        :host {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .track {
          position: relative;
          background: #222;
          border-radius: 4px;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);
          cursor: pointer;
          ${isVert ? 'width: 8px; height: 100px;' : 'width: 100px; height: 8px;'}
        }
        .fill {
          position: absolute;
          background: var(--_accent);
          border-radius: 4px;
          ${isVert ? 'bottom: 0; left: 0; right: 0; height: 50%;' : 'top: 0; bottom: 0; left: 0; width: 50%;'}
        }
        .handle {
          position: absolute;
          width: ${isVert ? '16px' : '16px'};
          height: ${isVert ? '24px' : '16px'};
          background: rgb(160, 160, 160);
          border-radius: 3px;
          transform: translate(-50%, -50%);
          cursor: grab;
          box-shadow:
            rgba(0, 0, 0, calc(var(--_key) - var(--_fill) + 0.1))
              calc(var(--_lx) * -2px)
              calc(var(--_ly) * -2px)
              4px 0px,
            inset
              calc(var(--_lx) * -1px)
              calc(var(--_ly) * -1px)
              0px 0px
              rgba(var(--_light-r), var(--_light-g), var(--_light-b), calc(var(--_key) * 0.8)),
            inset
              calc(var(--_lx) * 1px)
              calc(var(--_ly) * 1px)
              0px 0px
              rgba(0, 0, 0, calc(var(--_key) * 0.2)),
            inset 0 0 0 100px rgba(var(--_light-r), var(--_light-g), var(--_light-b), calc(var(--_key) * 0.3));
          ${isVert ? 'left: 50%; top: 50%;' : 'top: 50%; left: 50%;'}
        }
        .handle:active { cursor: grabbing; }
        .label {
          font-family: system-ui, sans-serif;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--amb-text-muted, #888);
        }
      </style>
      <div class="track" part="track">
        <div class="fill" part="fill"></div>
        <div class="handle" part="handle"></div>
      </div>
      ${label ? `<span class="label" part="label">${label}</span>` : ''}
    `;
    this.updatePosition();
  }
}

// --------------------------------------------------------------------------
// amb-switch - Toggle switch
// --------------------------------------------------------------------------
class AmbSwitch extends AmbientElement {
  static get observedAttributes() {
    return ['on', 'label'];
  }

  constructor() {
    super();
    this._on = false;
  }

  connectedCallback() {
    this.render();
    this.setupEvents();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'on') {
      this._on = newVal !== null;
      this.updateState();
    }
  }

  get on() { return this._on; }
  set on(v) {
    this._on = !!v;
    if (this._on) {
      this.setAttribute('on', '');
    } else {
      this.removeAttribute('on');
    }
    this.updateState();
    this.dispatchEvent(new CustomEvent('change', { detail: { on: this._on } }));
  }

  toggle() {
    this.on = !this._on;
  }

  updateState() {
    const handle = this.shadowRoot?.querySelector('.handle');
    const track = this.shadowRoot?.querySelector('.track');
    if (!handle || !track) return;

    if (this._on) {
      handle.style.left = '19px';
      track.classList.add('on');
    } else {
      handle.style.left = '3px';
      track.classList.remove('on');
    }
  }

  setupEvents() {
    this.shadowRoot.querySelector('.track').addEventListener('click', () => this.toggle());
  }

  render() {
    const label = this.getAttribute('label') || '';

    this.shadowRoot.innerHTML = `
      <style>
        ${AmbientElement.baseStyles}
        :host {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .track {
          width: 36px;
          height: 20px;
          background: rgb(25, 25, 35);
          border-radius: 4px;
          position: relative;
          cursor: pointer;
          box-shadow:
            inset 0 2px 4px rgba(0, 0, 0, 0.5),
            inset 0 0 0 100px rgba(var(--_light-r), var(--_light-g), var(--_light-b), calc(var(--_key) * 0.05));
          transition: box-shadow 0.15s ease;
        }
        .track.on {
          box-shadow:
            inset 0 2px 4px rgba(0, 0, 0, 0.5),
            inset 0 0 0 100px rgba(var(--_light-r), var(--_light-g), var(--_light-b), calc(var(--_key) * 0.1));
        }
        .handle {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 14px;
          height: 14px;
          background: rgb(160, 160, 160);
          border-radius: 3px;
          transition: left 0.15s ease;
          box-shadow:
            rgba(0, 0, 0, calc(var(--_key) + 0.1))
              calc(var(--_lx) * -1px)
              calc(var(--_ly) * -1px)
              3px 0px,
            inset
              calc(var(--_lx) * -1px)
              calc(var(--_ly) * -1px)
              0px 0px
              rgba(var(--_light-r), var(--_light-g), var(--_light-b), calc(var(--_key) * 0.8)),
            inset 0 0 0 100px rgba(var(--_light-r), var(--_light-g), var(--_light-b), calc(var(--_key) * 0.3));
        }
        .label {
          font-family: system-ui, sans-serif;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--amb-text-muted, #888);
        }
      </style>
      <div class="track" part="track">
        <div class="handle" part="handle"></div>
      </div>
      ${label ? `<span class="label" part="label">${label}</span>` : ''}
    `;
    this.updateState();
  }
}

// --------------------------------------------------------------------------
// amb-jack - Patch jack/socket
// --------------------------------------------------------------------------
class AmbJack extends AmbientElement {
  static get observedAttributes() {
    return ['connected', 'label'];
  }

  constructor() {
    super();
    this._connected = false;
  }

  connectedCallback() {
    this.render();
    this.setupEvents();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'connected') {
      this._connected = newVal !== null;
      this.updateState();
    }
  }

  get connected() { return this._connected; }
  set connected(v) {
    this._connected = !!v;
    if (this._connected) {
      this.setAttribute('connected', '');
    } else {
      this.removeAttribute('connected');
    }
    this.updateState();
    this.dispatchEvent(new CustomEvent('change', { detail: { connected: this._connected } }));
  }

  updateState() {
    const jack = this.shadowRoot?.querySelector('.jack');
    if (!jack) return;
    jack.classList.toggle('connected', this._connected);
  }

  setupEvents() {
    this.shadowRoot.querySelector('.jack').addEventListener('click', () => {
      this.connected = !this._connected;
    });
  }

  render() {
    const label = this.getAttribute('label') || '';

    this.shadowRoot.innerHTML = `
      <style>
        ${AmbientElement.baseStyles}
        :host {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }
        .jack {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgb(90, 90, 100);
          box-shadow:
            rgba(0, 0, 0, calc(var(--_key) - var(--_fill) + 0.1))
              calc(var(--_lx) * var(--_elevation) * -2px)
              calc(var(--_ly) * var(--_elevation) * -2px)
              calc(var(--_elevation) * 4px) 0px,
            inset
              calc(var(--_lx) * -1px)
              calc(var(--_ly) * -1px)
              1px 0px
              rgba(var(--_light-r), var(--_light-g), var(--_light-b), calc(var(--_key) * 0.4)),
            inset 0 0 0 100px rgba(var(--_light-r), var(--_light-g), var(--_light-b), calc(var(--_key) * 0.15));
          cursor: pointer;
          position: relative;
          transition: transform 0.15s ease;
        }
        .jack:hover {
          transform: scale(1.05);
        }
        .jack-inner {
          position: absolute;
          top: 6px;
          left: 6px;
          right: 6px;
          bottom: 6px;
          border-radius: 50%;
          background: #222;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.6);
        }
        .jack.connected .jack-inner::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 8px;
          height: 8px;
          background: #333;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
        }
        .label {
          font-family: system-ui, sans-serif;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.5px;
          color: var(--amb-text-muted, #888);
        }
      </style>
      <div class="jack" part="jack">
        <div class="jack-inner" part="inner"></div>
      </div>
      ${label ? `<span class="label" part="label">${label}</span>` : ''}
    `;
    this.updateState();
  }
}

// --------------------------------------------------------------------------
// amb-led - LED indicator
// --------------------------------------------------------------------------
class AmbLed extends AmbientElement {
  static get observedAttributes() {
    return ['on', 'color', 'label'];
  }

  constructor() {
    super();
    this._on = false;
  }

  connectedCallback() {
    this.render();
    this.setupEvents();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'on') {
      this._on = newVal !== null;
      this.updateState();
    } else if (name === 'color') {
      this.render();
    }
  }

  get on() { return this._on; }
  set on(v) {
    this._on = !!v;
    if (this._on) {
      this.setAttribute('on', '');
    } else {
      this.removeAttribute('on');
    }
    this.updateState();
    this.dispatchEvent(new CustomEvent('change', { detail: { on: this._on } }));
  }

  toggle() {
    this.on = !this._on;
  }

  updateState() {
    const led = this.shadowRoot?.querySelector('.led');
    if (!led) return;
    led.classList.toggle('on', this._on);
  }

  setupEvents() {
    this.shadowRoot.querySelector('.led').addEventListener('click', () => this.toggle());
  }

  render() {
    const label = this.getAttribute('label') || '';
    const color = this.getAttribute('color') || 'green';
    const colorMap = {
      red: '#ef4444',
      green: '#4ade80',
      amber: '#f59e0b',
      cyan: '#22d3d3',
      blue: '#3b82f6',
    };
    const emitColor = colorMap[color] || color;

    this.shadowRoot.innerHTML = `
      <style>
        ${AmbientElement.baseStyles}
        :host {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          --led-color: ${emitColor};
        }
        .led {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #2a2a3a;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .led.on {
          background: var(--led-color);
          box-shadow: 0 0 8px var(--led-color);
        }
        .label {
          font-family: system-ui, sans-serif;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--amb-text-muted, #888);
        }
      </style>
      <div class="led" part="led"></div>
      ${label ? `<span class="label" part="label">${label}</span>` : ''}
    `;
    this.updateState();
  }
}

// --------------------------------------------------------------------------
// amb-button - Push button
// --------------------------------------------------------------------------
class AmbButton extends AmbientElement {
  static get observedAttributes() {
    return ['active', 'label', 'momentary'];
  }

  constructor() {
    super();
    this._active = false;
  }

  connectedCallback() {
    this.render();
    this.setupEvents();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'active') {
      this._active = newVal !== null;
      this.updateState();
    }
  }

  get active() { return this._active; }
  set active(v) {
    this._active = !!v;
    if (this._active) {
      this.setAttribute('active', '');
    } else {
      this.removeAttribute('active');
    }
    this.updateState();
    this.dispatchEvent(new CustomEvent('change', { detail: { active: this._active } }));
  }

  get isMomentary() {
    return this.hasAttribute('momentary');
  }

  updateState() {
    const btn = this.shadowRoot?.querySelector('.button');
    if (!btn) return;
    btn.classList.toggle('active', this._active);
  }

  setupEvents() {
    const btn = this.shadowRoot.querySelector('.button');

    if (this.isMomentary) {
      btn.addEventListener('mousedown', () => { this.active = true; });
      btn.addEventListener('mouseup', () => { this.active = false; });
      btn.addEventListener('mouseleave', () => { this.active = false; });
      btn.addEventListener('touchstart', () => { this.active = true; });
      btn.addEventListener('touchend', () => { this.active = false; });
    } else {
      btn.addEventListener('click', () => { this.active = !this._active; });
    }
  }

  render() {
    const label = this.getAttribute('label') || '';

    this.shadowRoot.innerHTML = `
      <style>
        ${AmbientElement.baseStyles}
        :host {
          display: inline-block;
        }
        .button {
          min-width: 32px;
          height: 32px;
          padding: 0 8px;
          border-radius: 6px;
          border: none;
          font-family: system-ui, sans-serif;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          background: rgb(160, 160, 160);
          box-shadow:
            rgba(0, 0, 0, calc(var(--_key) - var(--_fill) + 0.05))
              calc(var(--_lx) * -2px)
              calc(var(--_ly) * -2px)
              4px 0px,
            inset
              calc(var(--_lx) * -1px)
              calc(var(--_ly) * -1px)
              0px 0px
              rgba(var(--_light-r), var(--_light-g), var(--_light-b), calc(var(--_key) * 0.8)),
            inset
              calc(var(--_lx) * 1px)
              calc(var(--_ly) * 1px)
              0px 0px
              rgba(0, 0, 0, calc(var(--_key) * 0.15)),
            inset 0 0 0 100px rgba(var(--_light-r), var(--_light-g), var(--_light-b), calc(var(--_key) * 0.3));
          color: #222;
        }
        .button:hover {
          transform: translateY(-1px);
        }
        .button:active {
          transform: translateY(1px);
          box-shadow:
            0 1px 2px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(var(--_light-r), var(--_light-g), var(--_light-b), 0.5);
        }
        .button.active {
          background: rgb(35, 35, 45);
          box-shadow:
            rgba(0, 0, 0, calc(var(--_key) - var(--_fill) + 0.05))
              calc(var(--_lx) * -2px)
              calc(var(--_ly) * -2px)
              4px 0px,
            inset
              calc(var(--_lx) * -1px)
              calc(var(--_ly) * -1px)
              0px 0px
              rgba(var(--_light-r), var(--_light-g), var(--_light-b), calc(var(--_key) * 0.2)),
            inset
              calc(var(--_lx) * 1px)
              calc(var(--_ly) * 1px)
              0px 0px
              rgba(0, 0, 0, calc(var(--_key) * 0.3)),
            inset 0 0 0 100px rgba(var(--_light-r), var(--_light-g), var(--_light-b), calc(var(--_key) * 0.1));
          color: var(--_accent);
        }
      </style>
      <button class="button" part="button">${label}</button>
    `;
    this.updateState();
  }
}

// --------------------------------------------------------------------------
// amb-panel - Container panel with optional screws
// --------------------------------------------------------------------------
class AmbPanel extends AmbientElement {
  static get observedAttributes() {
    return ['screws'];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const showScrews = this.hasAttribute('screws');

    this.shadowRoot.innerHTML = `
      <style>
        ${AmbientElement.baseStyles}
        :host {
          display: block;
        }
        .panel {
          background: rgb(35, 35, 45);
          border-radius: 12px;
          padding: 20px;
          position: relative;
          box-shadow:
            rgba(0, 0, 0, calc(var(--_key) - var(--_fill) + 0.15))
              calc(var(--_lx) * var(--_elevation) * -6px)
              calc(var(--_ly) * var(--_elevation) * -6px)
              calc(var(--_elevation) * 12px) 0px,
            inset
              calc(var(--_lx) * -1px)
              calc(var(--_ly) * -1px)
              0px 0px
              rgba(var(--_light-r), var(--_light-g), var(--_light-b), calc(var(--_key) * 0.12)),
            inset
              calc(var(--_lx) * 1px)
              calc(var(--_ly) * 1px)
              0px 0px
              rgba(0, 0, 0, calc(var(--_key) * 0.2)),
            inset 0 0 0 1000px rgba(var(--_light-r), var(--_light-g), var(--_light-b), calc(var(--_key) * 0.12));
        }
        .screw {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgb(100, 100, 110);
          box-shadow:
            inset
              calc(var(--_lx) * -1px)
              calc(var(--_ly) * -1px)
              1px 0px
              rgba(var(--_light-r), var(--_light-g), var(--_light-b), calc(var(--_key) * 0.4)),
            inset
              calc(var(--_lx) * 1px)
              calc(var(--_ly) * 1px)
              1px 0px
              rgba(0, 0, 0, 0.4),
            0 1px 2px rgba(0, 0, 0, 0.2),
            inset 0 0 0 100px rgba(var(--_light-r), var(--_light-g), var(--_light-b), calc(var(--_key) * 0.15));
        }
        .screw::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 6px;
          height: 1px;
          background: rgba(0, 0, 0, 0.5);
          transform: translate(-50%, -50%) rotate(45deg);
        }
        .screw.tl { top: 8px; left: 8px; }
        .screw.tr { top: 8px; right: 8px; }
        .screw.bl { bottom: 8px; left: 8px; }
        .screw.br { bottom: 8px; right: 8px; }
        .content {
          position: relative;
        }
      </style>
      <div class="panel" part="panel">
        ${showScrews ? `
          <div class="screw tl" part="screw"></div>
          <div class="screw tr" part="screw"></div>
          <div class="screw bl" part="screw"></div>
          <div class="screw br" part="screw"></div>
        ` : ''}
        <div class="content" part="content">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

// --------------------------------------------------------------------------
// Register all components
// --------------------------------------------------------------------------
customElements.define('amb-knob', AmbKnob);
customElements.define('amb-fader', AmbFader);
customElements.define('amb-switch', AmbSwitch);
customElements.define('amb-jack', AmbJack);
customElements.define('amb-led', AmbLed);
customElements.define('amb-button', AmbButton);
customElements.define('amb-panel', AmbPanel);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AmbKnob, AmbFader, AmbSwitch, AmbJack, AmbLed, AmbButton, AmbPanel };
}
