// ==========================================================================
// Ambient CSS - Modular Rack Interface (Knoblaunch Style)
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // Theme Toggle
  // --------------------------------------------------------------------------
  const lightBtn = document.getElementById('lightBtn');
  const darkBtn = document.getElementById('darkBtn');

  function setTheme(theme) {
    if (theme === 'light') {
      document.body.setAttribute('data-theme', 'light');
      lightBtn?.classList.add('active');
      darkBtn?.classList.remove('active');
    } else {
      document.body.removeAttribute('data-theme');
      darkBtn?.classList.add('active');
      lightBtn?.classList.remove('active');
    }
  }

  lightBtn?.addEventListener('click', () => setTheme('light'));
  darkBtn?.addEventListener('click', () => setTheme('dark'));

  // --------------------------------------------------------------------------
  // Toggle Buttons
  // --------------------------------------------------------------------------
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // For grouped buttons (S/M/B style), toggle individually
      btn.classList.toggle('active');
    });
  });

  // --------------------------------------------------------------------------
  // Switches (data-state toggle)
  // --------------------------------------------------------------------------
  document.querySelectorAll('.switch').forEach(sw => {
    sw.addEventListener('click', () => {
      const currentState = sw.getAttribute('data-state');
      if (currentState === 'on') {
        sw.setAttribute('data-state', 'off');
      } else {
        sw.setAttribute('data-state', 'on');
      }
    });
  });

  // --------------------------------------------------------------------------
  // Knob Rotation
  // --------------------------------------------------------------------------
  let activeKnob = null;
  let startY = 0;
  let startRotation = 0;

  function getKnobRotation(knob) {
    const transform = knob.style.transform || '';
    const match = transform.match(/rotate\(([-\d.]+)deg\)/);
    return match ? parseFloat(match[1]) : 0;
  }

  function setKnobRotation(knob, degrees) {
    const clamped = Math.max(-135, Math.min(135, degrees));
    knob.style.transform = `rotate(${clamped}deg)`;
  }

  // Initialize knob rotations based on data-value
  document.querySelectorAll('.knob').forEach(knob => {
    const value = parseInt(knob.getAttribute('data-value') || '50');
    // Map 0-100 to -135 to 135 degrees
    const rotation = ((value / 100) * 270) - 135;
    setKnobRotation(knob, rotation);

    knob.addEventListener('mousedown', (e) => {
      activeKnob = knob;
      startY = e.clientY;
      startRotation = getKnobRotation(knob);
      knob.style.cursor = 'grabbing';
      e.preventDefault();
    });

    knob.addEventListener('touchstart', (e) => {
      activeKnob = knob;
      startY = e.touches[0].clientY;
      startRotation = getKnobRotation(knob);
      e.preventDefault();
    });
  });

  document.addEventListener('mousemove', (e) => {
    if (!activeKnob) return;
    const deltaY = startY - e.clientY;
    const newRotation = startRotation + deltaY * 0.8;
    setKnobRotation(activeKnob, newRotation);
  });

  document.addEventListener('touchmove', (e) => {
    if (!activeKnob) return;
    const deltaY = startY - e.touches[0].clientY;
    const newRotation = startRotation + deltaY * 0.8;
    setKnobRotation(activeKnob, newRotation);
  });

  document.addEventListener('mouseup', () => {
    if (activeKnob) {
      activeKnob.style.cursor = 'grab';
      activeKnob = null;
    }
  });

  document.addEventListener('touchend', () => {
    activeKnob = null;
  });

  // --------------------------------------------------------------------------
  // Slider Dragging
  // --------------------------------------------------------------------------
  let activeSlider = null;
  let sliderTrack = null;

  document.querySelectorAll('.slider-handle').forEach(handle => {
    handle.addEventListener('mousedown', (e) => {
      activeSlider = handle;
      sliderTrack = handle.parentElement;
      e.preventDefault();
    });

    handle.addEventListener('touchstart', (e) => {
      activeSlider = handle;
      sliderTrack = handle.parentElement;
      e.preventDefault();
    });
  });

  document.addEventListener('mousemove', (e) => {
    if (!activeSlider) return;
    updateSliderPosition(e.clientX);
  });

  document.addEventListener('touchmove', (e) => {
    if (!activeSlider) return;
    updateSliderPosition(e.touches[0].clientX);
  });

  function updateSliderPosition(clientX) {
    const trackRect = sliderTrack.getBoundingClientRect();
    let percent = ((clientX - trackRect.left) / trackRect.width) * 100;
    percent = Math.max(0, Math.min(100, percent));
    activeSlider.style.left = `${percent}%`;

    // Update the fill as well
    const fill = sliderTrack.querySelector('.slider-fill');
    if (fill) {
      fill.style.width = `${percent}%`;
    }
  }

  document.addEventListener('mouseup', () => {
    activeSlider = null;
    sliderTrack = null;
  });

  document.addEventListener('touchend', () => {
    activeSlider = null;
    sliderTrack = null;
  });

  // --------------------------------------------------------------------------
  // Jack Click (visual feedback)
  // --------------------------------------------------------------------------
  document.querySelectorAll('.jack').forEach(jack => {
    jack.addEventListener('click', () => {
      jack.classList.toggle('connected');
    });
  });

  // --------------------------------------------------------------------------
  // Empty Slot Click
  // --------------------------------------------------------------------------
  document.querySelectorAll('.slot.empty').forEach(slot => {
    slot.addEventListener('click', () => {
      console.log('Add module clicked');
    });
  });

  // --------------------------------------------------------------------------
  // Menu Button
  // --------------------------------------------------------------------------
  const menuBtn = document.getElementById('menuBtn');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      console.log('Menu clicked');
    });
  }
});
