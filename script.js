// Synth Control Panel for Ambient CSS

const demoBlock = document.getElementById('demo-block');

// Night and Day presets
const nightPreset = {
  bgColor: 'rgb(36, 43, 60)',
  lightX: 1,
  lightY: -1,
  keyLight: 0.3,
  fillLight: 0
};

const dayPreset = {
  bgColor: 'rgb(239, 240, 242)',
  lightX: -1,
  lightY: -1,
  keyLight: 0.9,
  fillLight: 0.6
};

// Interpolate between two values
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Parse rgb string to array
function parseRgb(str) {
  const match = str.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : [0, 0, 0];
}

// === Day/Night Fader ===
const daynightInput = document.getElementById('daynight');
const daynightCap = document.getElementById('daynight-cap');

function updateDayNight(value) {
  const t = value / 100;

  // Interpolate background color
  const nightRgb = parseRgb(nightPreset.bgColor);
  const dayRgb = parseRgb(dayPreset.bgColor);
  const r = Math.round(lerp(nightRgb[0], dayRgb[0], t));
  const g = Math.round(lerp(nightRgb[1], dayRgb[1], t));
  const b = Math.round(lerp(nightRgb[2], dayRgb[2], t));
  document.body.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;

  // Interpolate lighting
  const lightX = lerp(nightPreset.lightX, dayPreset.lightX, t);
  const keyLight = lerp(nightPreset.keyLight, dayPreset.keyLight, t);
  const fillLight = lerp(nightPreset.fillLight, dayPreset.fillLight, t);

  document.documentElement.style.setProperty('--amb-light-x', lightX);
  document.documentElement.style.setProperty('--amb-key-light-intensity', keyLight);
  document.documentElement.style.setProperty('--amb-fill-light-intensity', fillLight);

  // Update other controls to reflect
  document.getElementById('lightx').value = lightX * 100;
  document.getElementById('keylight').value = keyLight * 100;
  document.getElementById('filllight').value = fillLight * 100;
  updateKnob('lightx', lightX * 100, -100, 100);
  updateSlider('keylight', keyLight * 100);
  updateSlider('filllight', fillLight * 100);

  // Update fader cap position
  const trackWidth = 180 - 24; // track width minus cap width
  daynightCap.style.left = `${10 + (value / 100) * trackWidth}px`;
}

daynightInput.addEventListener('input', (e) => updateDayNight(e.target.value));

// === Knob Controls ===
function updateKnob(id, value, min, max) {
  const pointer = document.getElementById(`${id}-pointer`);
  const ring = document.getElementById(`${id}-ring`);

  // Map value to rotation (-135deg to +135deg = 270deg range)
  const normalized = (value - min) / (max - min);
  const rotation = -135 + normalized * 270;

  pointer.style.transform = `rotate(${rotation}deg)`;
  ring.style.setProperty('--knob-angle', `${normalized * 270}deg`);
}

// Elevation Knob
const elevationInput = document.getElementById('elevation');
elevationInput.addEventListener('input', (e) => {
  const value = parseInt(e.target.value);
  demoBlock.className = `demo-block ambient ${document.getElementById('fillet').checked ? 'amb-fillet' : ''} ${document.getElementById('chamfer').checked ? 'amb-chamfer' : ''} amb-elevation-${value}`;
  updateKnob('elevation', value, 0, 3);
});

// Light X Knob
const lightxInput = document.getElementById('lightx');
lightxInput.addEventListener('input', (e) => {
  const value = parseInt(e.target.value) / 100;
  document.documentElement.style.setProperty('--amb-light-x', value);
  updateKnob('lightx', e.target.value, -100, 100);
});

// Light Y Knob
const lightyInput = document.getElementById('lighty');
lightyInput.addEventListener('input', (e) => {
  const value = parseInt(e.target.value) / 100;
  document.documentElement.style.setProperty('--amb-light-y', value);
  updateKnob('lighty', e.target.value, -100, 100);
});

// === Slider Controls ===
function updateSlider(id, value) {
  const fill = document.getElementById(`${id}-fill`);
  const cap = document.getElementById(`${id}-cap`);

  // Fill height (0-100 maps to 0-100px from bottom)
  const fillHeight = value;
  fill.style.height = `${fillHeight}px`;

  // Cap position (inverted because 0 is at bottom)
  const capTop = 10 + (100 - value);
  cap.style.top = `${capTop}px`;
}

// Key Light Slider
const keylightInput = document.getElementById('keylight');
keylightInput.addEventListener('input', (e) => {
  const value = parseInt(e.target.value) / 100;
  document.documentElement.style.setProperty('--amb-key-light-intensity', value);
  updateSlider('keylight', e.target.value);
});

// Fill Light Slider
const filllightInput = document.getElementById('filllight');
filllightInput.addEventListener('input', (e) => {
  const value = parseInt(e.target.value) / 100;
  document.documentElement.style.setProperty('--amb-fill-light-intensity', value);
  updateSlider('filllight', e.target.value);
});

// === Toggle Controls ===
function updateDemoClasses() {
  const elevation = document.getElementById('elevation').value;
  const fillet = document.getElementById('fillet').checked;
  const chamfer = document.getElementById('chamfer').checked;

  demoBlock.className = `demo-block ambient ${fillet ? 'amb-fillet' : ''} ${chamfer ? 'amb-chamfer' : ''} amb-elevation-${elevation}`;
}

document.getElementById('fillet').addEventListener('change', updateDemoClasses);
document.getElementById('chamfer').addEventListener('change', updateDemoClasses);

// === Initialize all controls ===
function initControls() {
  // Day/Night fader
  updateDayNight(daynightInput.value);

  // Knobs
  updateKnob('elevation', elevationInput.value, 0, 3);
  updateKnob('lightx', lightxInput.value, -100, 100);
  updateKnob('lighty', lightyInput.value, -100, 100);

  // Sliders
  updateSlider('keylight', keylightInput.value);
  updateSlider('filllight', filllightInput.value);

  // Demo block classes
  updateDemoClasses();
}

// Run on load
initControls();
