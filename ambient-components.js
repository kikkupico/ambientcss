// ==========================================================================
// Ambient Components v0.2
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

        /* Surface colors */
        --_surface-dark: var(--amb-surface-dark, 35, 35, 45);
        --_surface-light: var(--amb-surface-light, 40, 40, 52);
        --_surface-inset: var(--amb-surface-inset, 20, 20, 28);
        --_handle: var(--amb-handle, 160, 160, 160);
      }
    `;
  }

  // Shared label styles
  static get labelStyles() {
    return `
      .label {
        font-family: system-ui, sans-serif;
        font-size: 9px;
        font-weight: 600;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: var(--amb-label-color, var(--amb-text-muted, #888));
      }
    `;
  }

  // Lume text styles (adaptive to lighting) - dark in bright light, light in dark
  static get lumeStyles() {
    return `
      .lume {
        color: #777;
        color: color-mix(
          in srgb,
          #404048 calc(var(--_key) * 100%),
          #a8a8b0
        );
      }
    `;
  }

  // Box-shadow generator for consistent shadows across components
  static shadow({ drop, highlight, shadowEdge, overlay, inset = false } = {}) {
    const parts = [];

    if (drop && !inset) {
      parts.push(`
        rgba(0, 0, 0, calc(var(--_key) - var(--_fill) + ${drop.opacity || 0.1}))
          calc(var(--_lx) * ${drop.x || -2}px)
          calc(var(--_ly) * ${drop.y || -2}px)
          ${drop.blur || 4}px
          ${drop.spread || 0}px
      `);
    }

    if (inset && drop) {
      parts.push(`
        inset
          calc(var(--_lx) * ${drop.x || -3}px)
          calc(var(--_ly) * ${drop.y || -3}px)
          ${drop.blur || 6}px
          ${drop.spread || 0}px
          rgba(0, 0, 0, calc(var(--_key) * ${drop.opacity || 0.4}))
      `);
    }

    if (highlight) {
      parts.push(`
        inset
          calc(var(--_lx) * -${highlight.width || 1}px)
          calc(var(--_ly) * -${highlight.width || 1}px)
          ${highlight.blur || 0}px 0px
          rgba(var(--_light-r), var(--_light-g), var(--_light-b), calc(var(--_key) * ${highlight.opacity || 0.5}))
      `);
    }

    if (shadowEdge) {
      parts.push(`
        inset
          calc(var(--_lx) * ${shadowEdge.width || 1}px)
          calc(var(--_ly) * ${shadowEdge.width || 1}px)
          ${shadowEdge.blur || 0}px 0px
          rgba(0, 0, 0, calc(var(--_key) * ${shadowEdge.opacity || 0.3}))
      `);
    }

    if (overlay) {
      parts.push(`
        inset 0 0 0 ${overlay.spread || 100}px
          rgba(var(--_light-r), var(--_light-g), var(--_light-b), calc(var(--_key) * ${overlay.opacity || 0.15}))
      `);
    }

    return parts.join(',');
  }

  // Shade configuration for light/dark variants
  static shadeConfig(shade) {
    const isLight = shade === 'light';
    return {
      isLight,
      bg: isLight ? 'rgb(var(--_surface-light))' : 'rgb(var(--_surface-dark))',
      bgRaw: isLight ? 'var(--_surface-light)' : 'var(--_surface-dark)',
      innerBg: isLight ? 'rgb(28, 28, 38)' : 'rgb(var(--_surface-light))',
      highlightMult: isLight ? 0.5 : 0.3,
      brightnessMult: isLight ? 0.95 : 0.15,
      innerBrightness: isLight ? 0.85 : 0.1,
      indicatorColor: isLight ? '#333' : '#fff',
      indicatorGlow: isLight ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)',
    };
  }

  // Setup drag behavior for knobs/faders/sliders
  setupDrag(element, { onStart, onMove, onEnd, getCoord = (e) => e.clientY }) {
    const start = (e) => {
      const coord = e.touches ? getCoord(e.touches[0]) : getCoord(e);
      onStart?.(coord, e);
      e.preventDefault();
    };

    const move = (e) => {
      const coord = e.touches ? getCoord(e.touches[0]) : getCoord(e);
      onMove?.(coord, e);
    };

    const end = () => {
      onEnd?.();
    };

    element.addEventListener('mousedown', start);
    element.addEventListener('touchstart', start);
    document.addEventListener('mousemove', move);
    document.addEventListener('touchmove', move);
    document.addEventListener('mouseup', end);
    document.addEventListener('touchend', end);
  }

  // Initialize value properties (min, max, value)
  initValue(min = 0, max = 100, initial = 50) {
    this._value = initial;
    this._min = min;
    this._max = max;
  }

  // Initialize toggle property
  initToggle(propName, initial = false) {
    this[`_${propName}`] = initial;
  }

  // Check if component is in flat material mode
  get isFlat() {
    return this.hasAttribute('material') && this.getAttribute('material') === 'flat';
  }

  // Get flat-aware box-shadow
  getFlatShadow(normalShadow, flatOverlayOpacity = 0.15) {
    if (this.isFlat) {
      return `inset 0 0 0 100px rgba(var(--_light-r), var(--_light-g), var(--_light-b), calc(var(--_key) * ${flatOverlayOpacity}))`;
    }
    return normalShadow;
  }
}

// --------------------------------------------------------------------------
// amb-knob - Rotary control
// --------------------------------------------------------------------------
class AmbKnob extends AmbientElement {
  static get observedAttributes() {
    return ['value', 'min', 'max', 'size', 'label', 'shade', 'material'];
  }

  constructor() {
    super();
    this.initValue(0, 100, 50);
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
      case 'shade':
      case 'material':
        this.render();
        this.setupEvents();
        return;
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
    if (!knob) return;

    this.setupDrag(knob, {
      onStart: (y) => {
        this._dragging = true;
        this._startY = y;
        this._startValue = this._value;
        knob.classList.add('grabbing');
      },
      onMove: (y) => {
        if (!this._dragging) return;
        const delta = this._startY - y;
        const range = this._max - this._min;
        const sensitivity = range / 150;
        this.value = this._startValue + (delta * sensitivity);
      },
      onEnd: () => {
        this._dragging = false;
        knob.classList.remove('grabbing');
      },
      getCoord: (e) => e.clientY
    });
  }

  render() {
    const size = this.getAttribute('size') || 'medium';
    const label = this.getAttribute('label') || '';
    const s = AmbientElement.shadeConfig(this.getAttribute('shade'));
    const sizeMap = { small: 40, medium: 52, large: 64 };
    const sz = sizeMap[size] || 52;

    const knobShadow = this.getFlatShadow(
      AmbientElement.shadow({
        drop: { opacity: 0.2, x: -4, y: -4, blur: 8 },
        highlight: { width: 1, blur: 2, opacity: s.highlightMult },
        shadowEdge: { width: 1, blur: 2, opacity: 0.5 },
        overlay: { spread: 100, opacity: s.brightnessMult }
      }),
      s.brightnessMult
    );

    const innerShadow = this.getFlatShadow(
      `inset 0 2px 6px rgba(0, 0, 0, ${s.isLight ? '0.3' : '0.5'}),
       inset 0 0 0 100px rgba(var(--_light-r), var(--_light-g), var(--_light-b), calc(var(--_key) * ${s.innerBrightness}))`,
      s.innerBrightness
    );

    this.shadowRoot.innerHTML = `
      <style>
        ${AmbientElement.baseStyles}
        ${AmbientElement.labelStyles}
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
          background: ${s.bg};
          box-shadow: ${knobShadow};
        }
        .knob.grabbing { cursor: grabbing; }
        .knob-inner {
          position: absolute;
          top: 3px;
          left: 3px;
          right: 3px;
          bottom: 3px;
          border-radius: 50%;
          background: ${s.innerBg};
          box-shadow: ${innerShadow};
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
          background: ${s.indicatorColor};
          border-radius: 2px;
          transform: translateX(-50%);
          box-shadow: 0 0 4px ${s.indicatorGlow};
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
// amb-range - Base class for linear range controls (fader, slider)
// --------------------------------------------------------------------------
class AmbRangeControl extends AmbientElement {
  static get observedAttributes() {
    return ['value', 'min', 'max', 'label', 'shade', 'material'];
  }

  constructor() {
    super();
    this.initValue(0, 100, 50);
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
      case 'shade':
      case 'material':
        this.render();
        this.setupEvents();
        return;
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

  // To be implemented by subclasses
  get isVertical() { return false; }
  updatePosition() {}
  render() {}

  setupEvents() {
    const track = this.shadowRoot?.querySelector('.track');
    if (!track) return;

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

    this.setupDrag(track, {
      onStart: (_, e) => {
        this._dragging = true;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        updateFromPosition(clientX, clientY);
      },
      onMove: (_, e) => {
        if (!this._dragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        updateFromPosition(clientX, clientY);
      },
      onEnd: () => {
        this._dragging = false;
      },
      getCoord: () => 0 // We handle coords in the callbacks
    });
  }

  // Shared handle shadow
  getHandleShadow() {
    return this.getFlatShadow(
      AmbientElement.shadow({
        drop: { opacity: 0.1, x: -2, y: -2, blur: 4 },
        highlight: { width: 1, opacity: 0.8 },
        shadowEdge: { width: 1, opacity: 0.2 },
        overlay: { spread: 100, opacity: 0.3 }
      }),
      0.3
    );
  }
}

// --------------------------------------------------------------------------
// amb-fader - Vertical linear slider control
// --------------------------------------------------------------------------
class AmbFader extends AmbRangeControl {
  static get observedAttributes() {
    return ['value', 'min', 'max', 'orientation', 'label', 'material'];
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

  render() {
    const label = this.getAttribute('label') || '';
    const isVert = this.isVertical;

    this.shadowRoot.innerHTML = `
      <style>
        ${AmbientElement.baseStyles}
        ${AmbientElement.labelStyles}
        :host {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .track {
          position: relative;
          background: rgb(var(--_surface-inset));
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
          background: rgb(var(--_handle));
          border-radius: 3px;
          transform: translate(-50%, -50%);
          cursor: grab;
          box-shadow: ${this.getHandleShadow()};
          ${isVert ? 'left: 50%; top: 50%;' : 'top: 50%; left: 50%;'}
        }
        .handle:active { cursor: grabbing; }
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
// amb-slider - Horizontal slider control
// --------------------------------------------------------------------------
class AmbSlider extends AmbRangeControl {
  get isVertical() { return false; }

  updatePosition() {
    const thumb = this.shadowRoot?.querySelector('.thumb');
    const fill = this.shadowRoot?.querySelector('.fill');
    if (!thumb || !fill) return;

    const percent = ((this._value - this._min) / (this._max - this._min)) * 100;
    thumb.style.left = `${percent}%`;
    fill.style.width = `${percent}%`;
  }

  render() {
    const label = this.getAttribute('label') || '';
    const s = AmbientElement.shadeConfig(this.getAttribute('shade'));

    const thumbShadow = this.getFlatShadow(
      AmbientElement.shadow({
        drop: { opacity: 0.1, x: -2, y: -2, blur: 4 },
        highlight: { width: 1, opacity: 0.6 },
        shadowEdge: { width: 1, opacity: 0.2 },
        overlay: { spread: 100, opacity: s.brightnessMult }
      }),
      s.brightnessMult
    );

    this.shadowRoot.innerHTML = `
      <style>
        ${AmbientElement.baseStyles}
        ${AmbientElement.lumeStyles}
        :host {
          display: inline-flex;
          flex-direction: column;
          gap: 8px;
          min-width: 120px;
        }
        .track {
          position: relative;
          height: 6px;
          background: rgb(var(--_surface-inset));
          border-radius: 3px;
          cursor: pointer;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);
        }
        .fill {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          width: 50%;
          background: var(--_accent);
          border-radius: 3px;
          pointer-events: none;
        }
        .thumb {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 16px;
          height: 16px;
          background: ${s.bg};
          border-radius: 50%;
          transform: translate(-50%, -50%);
          cursor: grab;
          box-shadow: ${thumbShadow};
        }
        .thumb:active { cursor: grabbing; }
        .label {
          font-family: system-ui, sans-serif;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #777;
          color: color-mix(
            in srgb,
            #404048 calc(var(--_key) * 100%),
            #a8a8b0
          );
        }
      </style>
      ${label ? `<span class="label" part="label">${label}</span>` : ''}
      <div class="track" part="track">
        <div class="fill" part="fill"></div>
        <div class="thumb" part="thumb"></div>
      </div>
    `;
    this.updatePosition();
  }
}

// --------------------------------------------------------------------------
// amb-switch - Toggle switch
// --------------------------------------------------------------------------
class AmbSwitch extends AmbientElement {
  static get observedAttributes() {
    return ['on', 'label', 'material'];
  }

  constructor() {
    super();
    this.initToggle('on', false);
  }

  connectedCallback() {
    this.render();
    this.setupEvents();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'on') {
      this._on = newVal !== null;
      this.updateState();
    } else if (name === 'material') {
      this.render();
      this.setupEvents();
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
    const track = this.shadowRoot?.querySelector('.track');
    if (track) {
      track.addEventListener('click', () => this.toggle());
    }
  }

  render() {
    const label = this.getAttribute('label') || '';

    const trackShadow = this.getFlatShadow(
      `inset 0 2px 4px rgba(0, 0, 0, 0.5),
       inset 0 0 0 100px rgba(var(--_light-r), var(--_light-g), var(--_light-b), calc(var(--_key) * 0.05))`,
      0.05
    );

    const handleShadow = this.getFlatShadow(
      AmbientElement.shadow({
        drop: { opacity: 0.1, x: -1, y: -1, blur: 3 },
        highlight: { width: 1, opacity: 0.8 },
        overlay: { spread: 100, opacity: 0.3 }
      }),
      0.3
    );

    this.shadowRoot.innerHTML = `
      <style>
        ${AmbientElement.baseStyles}
        ${AmbientElement.labelStyles}
        :host {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .track {
          width: 36px;
          height: 20px;
          background: rgb(var(--_surface-inset));
          border-radius: 4px;
          position: relative;
          cursor: pointer;
          box-shadow: ${trackShadow};
          transition: box-shadow 0.15s ease;
        }
        .track.on {
          box-shadow: ${this.getFlatShadow(
            `inset 0 2px 4px rgba(0, 0, 0, 0.5),
             inset 0 0 0 100px rgba(var(--_light-r), var(--_light-g), var(--_light-b), calc(var(--_key) * 0.1))`,
            0.1
          )};
        }
        .handle {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 14px;
          height: 14px;
          background: rgb(var(--_handle));
          border-radius: 3px;
          transition: left 0.15s ease;
          box-shadow: ${handleShadow};
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
    return ['connected', 'label', 'material'];
  }

  constructor() {
    super();
    this.initToggle('connected', false);
  }

  connectedCallback() {
    this.render();
    this.setupEvents();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'connected') {
      this._connected = newVal !== null;
      this.updateState();
    } else if (name === 'material') {
      this.render();
      this.setupEvents();
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
    const jack = this.shadowRoot?.querySelector('.jack');
    if (jack) {
      jack.addEventListener('click', () => {
        this.connected = !this._connected;
      });
    }
  }

  render() {
    const label = this.getAttribute('label') || '';

    const jackShadow = this.getFlatShadow(
      AmbientElement.shadow({
        drop: { opacity: 0.1, x: -2, y: -2, blur: 4 },
        highlight: { width: 1, opacity: 0.4 },
        overlay: { spread: 100, opacity: 0.15 }
      }),
      0.15
    );

    this.shadowRoot.innerHTML = `
      <style>
        ${AmbientElement.baseStyles}
        ${AmbientElement.labelStyles}
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
          box-shadow: ${jackShadow};
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
          background: rgb(var(--_surface-inset));
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
    this.initToggle('on', false);
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
    const led = this.shadowRoot?.querySelector('.led');
    if (led) {
      led.addEventListener('click', () => this.toggle());
    }
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
        ${AmbientElement.labelStyles}
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
          background: rgb(var(--_surface-dark));
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .led.on {
          background: var(--led-color);
          box-shadow: 0 0 8px var(--led-color);
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
    return ['active', 'label', 'momentary', 'material'];
  }

  constructor() {
    super();
    this.initToggle('active', false);
  }

  connectedCallback() {
    this.render();
    this.setupEvents();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'active') {
      this._active = newVal !== null;
      this.updateState();
    } else if (name === 'material') {
      this.render();
      this.setupEvents();
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
    const btn = this.shadowRoot?.querySelector('.button');
    if (!btn) return;

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

    const buttonShadow = this.getFlatShadow(
      AmbientElement.shadow({
        drop: { opacity: 0.05, x: -2, y: -2, blur: 4 },
        highlight: { width: 1, opacity: 0.8 },
        shadowEdge: { width: 1, opacity: 0.15 },
        overlay: { spread: 100, opacity: 0.3 }
      }),
      0.3
    );

    const activeShadow = this.getFlatShadow(
      AmbientElement.shadow({
        drop: { opacity: 0.05, x: -2, y: -2, blur: 4 },
        highlight: { width: 1, opacity: 0.2 },
        shadowEdge: { width: 1, opacity: 0.3 },
        overlay: { spread: 100, opacity: 0.1 }
      }),
      0.1
    );

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
          background: rgb(var(--_handle));
          box-shadow: ${buttonShadow};
          color: #222;
        }
        .button:hover {
          transform: translateY(-1px);
        }
        .button:active {
          transform: translateY(1px);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(var(--_light-r), var(--_light-g), var(--_light-b), 0.5);
        }
        .button.active {
          background: rgb(var(--_surface-dark));
          box-shadow: ${activeShadow};
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
    return ['screws', 'shade', 'material'];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const showScrews = this.hasAttribute('screws');
    const s = AmbientElement.shadeConfig(this.getAttribute('shade'));

    const screwBg = s.isLight ? 'rgb(50, 50, 60)' : 'rgb(100, 100, 110)';

    const panelShadow = this.getFlatShadow(
      AmbientElement.shadow({
        drop: { opacity: 0.15, x: -6, y: -6, blur: 12 },
        highlight: { width: 1, opacity: s.highlightMult },
        shadowEdge: { width: 1, opacity: 0.2 },
        overlay: { spread: 1000, opacity: s.brightnessMult }
      }),
      s.brightnessMult
    );

    const screwShadow = this.getFlatShadow(
      AmbientElement.shadow({
        highlight: { width: 1, opacity: 0.4 },
        shadowEdge: { width: 1, opacity: 0.4 },
        overlay: { spread: 100, opacity: 0.15 }
      }) + ', 0 1px 2px rgba(0, 0, 0, 0.2)',
      0.15
    );

    this.shadowRoot.innerHTML = `
      <style>
        ${AmbientElement.baseStyles}
        :host {
          display: block;
        }
        .panel {
          background: ${s.bg};
          border-radius: 12px;
          padding: 20px;
          position: relative;
          box-shadow: ${panelShadow};
        }
        .screw {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: ${screwBg};
          box-shadow: ${screwShadow};
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
          --amb-label-color: #777;
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
// amb-subpanel - Section within a panel with grooved heading line
// --------------------------------------------------------------------------
class AmbSubpanel extends AmbientElement {
  static get observedAttributes() {
    return ['label', 'material'];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const label = this.getAttribute('label') || '';

    const grooveShadow = this.getFlatShadow(
      `inset calc(var(--_lx) * -1px) calc(var(--_ly) * -1px) 1px 0px rgba(0, 0, 0, calc(var(--_key) * 0.5)),
       inset calc(var(--_lx) * 1px) calc(var(--_ly) * 1px) 0 0 rgba(255, 255, 255, calc(var(--_key) * 0.15)),
       inset 0 0 0 100px rgba(var(--_light-r), var(--_light-g), var(--_light-b), calc(var(--_key) * 0.8))`,
      0.8
    );

    this.shadowRoot.innerHTML = `
      <style>
        ${AmbientElement.baseStyles}
        :host {
          display: block;
          margin: 24px 0;
        }
        :host(:first-child) {
          margin-top: 8px;
        }
        :host(:last-child) {
          margin-bottom: 8px;
        }
        .header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .groove {
          flex: 1;
          height: 2px;
          background: rgb(var(--_surface-inset));
          border-radius: 1px;
          box-shadow: ${grooveShadow};
        }
        .groove-left {
          flex: 0 0 24px;
        }
        .label {
          font-family: system-ui, sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          white-space: nowrap;
          color: #777;
          color: color-mix(
            in srgb,
            #404048 calc(var(--_key) * 100%),
            #a8a8b0
          );
        }
        .content {
          position: relative;
        }
      </style>
      <div class="header" part="header">
        <div class="groove groove-left" part="groove"></div>
        ${label ? `<span class="label" part="label">${label}</span>` : ''}
        <div class="groove" part="groove"></div>
      </div>
      <div class="content" part="content">
        <slot></slot>
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
customElements.define('amb-subpanel', AmbSubpanel);
customElements.define('amb-slider', AmbSlider);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AmbientElement,
    AmbRangeControl,
    AmbKnob,
    AmbFader,
    AmbSwitch,
    AmbJack,
    AmbLed,
    AmbButton,
    AmbPanel,
    AmbSubpanel,
    AmbSlider
  };
}
