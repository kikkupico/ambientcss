async function sleep(x) {
  return new Promise((resolve) => setTimeout(resolve, x));
}

let style = getComputedStyle(document.body);
let wait = Math.round(3000 / 180);

async function animateVar(variable, cond, step) {
  while (cond(parseFloat(style.getPropertyValue(variable)))) {
    let curr = parseFloat(style.getPropertyValue(variable));
    document.documentElement.style.setProperty(variable, curr + step);
    await sleep(wait);
  }
}

// Knob control functionality
const knob = document.getElementById("knob");
let isDragging = false;
let currentRotation = -110; // Start at day position

// Map rotation (-110 to +110) to lighting parameters
function updateLightingFromKnob(rotation) {
  // Normalize rotation from -110..110 to 0..1 (left to right)
  const normalized = (rotation + 110) / 220;

  // Map to lighting parameters
  // --amb-light-x: -1 (day/left) to 1 (night/right)
  const lightX = -1 + normalized * 2;

  // --amb-key-light-intensity: 0.9 (day) to 0.3 (night)
  const keyLight = 0.9 - normalized * 0.6;

  // --amb-fill-light-intensity: 0.6 (day) to 0 (night)
  const fillLight = 0.6 - normalized * 0.6;

  // --background-color: light to dark
  const bgRed = 239 - normalized * (239 - 36);
  const bgGreen = 240 - normalized * (240 - 43);
  const bgBlue = 242 - normalized * (242 - 60);

  document.documentElement.style.setProperty("--amb-light-x", lightX);
  document.documentElement.style.setProperty(
    "--amb-key-light-intensity",
    keyLight
  );
  document.documentElement.style.setProperty(
    "--amb-fill-light-intensity",
    fillLight
  );
  document.body.style.backgroundColor = `rgb(${Math.round(bgRed)},${Math.round(bgGreen)},${Math.round(bgBlue)})`;
}

// Set initial knob rotation
knob.style.setProperty("--knob-rotation", `${currentRotation}deg`);

// Handle knob dragging
knob.addEventListener("mousedown", (e) => {
  isDragging = true;
  knob.style.transition = "none";
  e.preventDefault();
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  const rect = knob.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const deltaX = e.clientX - centerX;
  const deltaY = e.clientY - centerY;

  // Calculate angle in degrees
  let angle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;

  // Adjust so that top is -90deg
  angle = angle + 90;

  // Constrain to -110 to +110 range
  if (angle > 180) angle -= 360;
  angle = Math.max(-110, Math.min(110, angle));

  currentRotation = angle;
  knob.style.setProperty("--knob-rotation", `${angle}deg`);
  updateLightingFromKnob(angle);
});

document.addEventListener("mouseup", () => {
  if (isDragging) {
    isDragging = false;
    knob.style.transition = "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
  }
});

// Animate knob rotation
async function animateKnob(targetRotation) {
  const startRotation = currentRotation;
  const diff = targetRotation - startRotation;
  const steps = 60; // Animation steps
  const stepSize = diff / steps;

  knob.style.transition = "transform 0.05s linear";

  for (let i = 0; i < steps; i++) {
    currentRotation += stepSize;
    knob.style.setProperty("--knob-rotation", `${currentRotation}deg`);
    updateLightingFromKnob(currentRotation);
    await sleep(50);
  }

  // Ensure we end exactly at target
  currentRotation = targetRotation;
  knob.style.setProperty("--knob-rotation", `${targetRotation}deg`);
  updateLightingFromKnob(targetRotation);

  knob.style.transition = "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
}

document
  .getElementById("button-day")
  .addEventListener("click", async function setDay() {
    // Animate knob to day position (-110deg)
    animateKnob(-110);
  });

document
  .getElementById("button-night")
  .addEventListener("click", async function setNight() {
    // Animate knob to night position (+110deg)
    animateKnob(110);
  });
