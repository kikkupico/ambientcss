document.addEventListener('DOMContentLoaded', () => {
  // --- Theme Toggle ---
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('night');
      // Update toggle text or state if needed
      const isNight = document.body.classList.contains('night');
      themeToggle.innerText = isNight ? 'Switch to Day' : 'Switch to Night';
    });
  }

  // --- Finish Toggle ---
  const finishRadios = document.querySelectorAll('input[name="finish"]');
  const previewContainer = document.querySelector('.component-library'); // Apply finish to library
  const testBox = document.getElementById('test-box-preview');

  function updateFinish(finish) {
    // List of all finish classes
    const finishes = ['amb-matte', 'amb-shiny'];

    [previewContainer, testBox].forEach(el => {
      if (!el) return;
      el.classList.remove(...finishes);
      if (finish !== 'default') {
        el.classList.add(`amb-${finish}`);
      }
    });
  }

  finishRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      updateFinish(e.target.value);
    });
  });

  // --- Test Box Logic ---
  const elevationInput = document.getElementById('ctrl-elevation');
  const thicknessInput = document.getElementById('ctrl-thickness');
  const angleInput = document.getElementById('ctrl-angle');

  function updateTestBox() {
    if (!testBox) return;

    const elevation = elevationInput ? elevationInput.value : 0;
    const thickness = thicknessInput ? thicknessInput.value : 0;
    const angle = angleInput ? parseInt(angleInput.value) : 135; // default 135 deg

    // Convert angle to x/y vectors (approx)
    // 0 deg = Right (1, 0)
    // 90 deg = Bottom (0, 1) -- CSS Y is down
    // But usually lighting is Top-Left (-1, -1) which is 225 or 135 depending on coord sys.
    // Let's use standard trig: x = cos(a), y = sin(a).
    // CSS Y is inverted relative to Cartesian? No, Y is down.
    // If light comes from top-left (135 deg visually?), shadows fall bottom-right.
    // The variables --amb-light-x/y represent the *shadow* direction or light direction?
    // Looking at CSS: `calc(var(--amb-light-x) * -1px)` implies light vector.
    // If light-x is 1 (Right), shadow logic: -1px (Left). Wait.
    // Let's stick to simple trig and let the user explore.

    const rad = angle * (Math.PI / 180);
    const x = Math.cos(rad).toFixed(2);
    const y = Math.sin(rad).toFixed(2); // Y down is positive in CSS, but let's see.

    testBox.style.setProperty('--amb-elevation', elevation);
    testBox.style.setProperty('--amb-thickness', thickness);
    testBox.style.setProperty('--amb-light-x', x);
    testBox.style.setProperty('--amb-light-y', y);
  }

  if (elevationInput) elevationInput.addEventListener('input', updateTestBox);
  if (thicknessInput) thicknessInput.addEventListener('input', updateTestBox);
  if (angleInput) angleInput.addEventListener('input', updateTestBox);

  // Init
  updateTestBox();

  // --- Component Logic (Demo) ---

  // Toggle Switches
  document.querySelectorAll('.amb-switch').forEach(sw => {
    sw.addEventListener('click', () => {
      const currentState = sw.getAttribute('data-state') || 'up';
      const newState = currentState === 'up' ? 'down' : 'up';
      sw.setAttribute('data-state', newState);
    });
  });

  // Multi-Switch
  document.querySelectorAll('.amb-multi-switch-option').forEach(opt => {
    opt.addEventListener('click', function() {
      const parent = this.parentElement;
      parent.querySelectorAll('.amb-multi-switch-option').forEach(o => o.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // Knobs (Simple rotation demo)
  document.querySelectorAll('.amb-knob').forEach(knob => {
      // Just a random interaction to show it works
      knob.addEventListener('click', () => {
          const dial = knob.querySelector('.amb-knob-dial');
          if(dial) {
              const currentRot = dial.style.transform.match(/rotate\((.*)deg\)/);
              let angle = currentRot ? parseInt(currentRot[1]) : 0;
              angle += 45;
              dial.style.transform = `rotate(${angle}deg)`;
          }
      });
  });

});
