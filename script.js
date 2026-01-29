// ==========================================================================
// Ambient CSS - Interactive Controls
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // Day/Night Toggle
  // --------------------------------------------------------------------------
  const btnDay = document.getElementById('btn-day');
  const btnNight = document.getElementById('btn-night');

  btnDay.addEventListener('click', () => {
    document.body.classList.add('day-mode');
    btnDay.classList.add('active');
    btnNight.classList.remove('active');
  });

  btnNight.addEventListener('click', () => {
    document.body.classList.remove('day-mode');
    btnNight.classList.add('active');
    btnDay.classList.remove('active');
  });

  // --------------------------------------------------------------------------
  // Finish Toggle
  // --------------------------------------------------------------------------
  const btnMatte = document.getElementById('btn-matte');
  const btnSatin = document.getElementById('btn-satin');
  const btnGloss = document.getElementById('btn-gloss');

  function setFinish(finish) {
    document.body.classList.remove('finish-matte', 'finish-satin', 'finish-gloss');
    document.body.classList.add(`finish-${finish}`);
    btnMatte.classList.remove('active');
    btnSatin.classList.remove('active');
    btnGloss.classList.remove('active');
    if (finish === 'matte') btnMatte.classList.add('active');
    if (finish === 'satin') btnSatin.classList.add('active');
    if (finish === 'gloss') btnGloss.classList.add('active');
  }

  btnMatte.addEventListener('click', () => setFinish('matte'));
  btnSatin.addEventListener('click', () => setFinish('satin'));
  btnGloss.addEventListener('click', () => setFinish('gloss'));

  // --------------------------------------------------------------------------
  // Interactive Test Box
  // --------------------------------------------------------------------------
  const testBox = document.getElementById('test-box');
  const testOpts = document.querySelectorAll('.test-opt');

  // Current state
  let state = {
    elevation: 0,
    edge: 'none',
    thickness: 0,
    emitter: 'off'
  };

  function updateTestBox() {
    // Reset CSS variables
    testBox.style.setProperty('--amb-elevation', state.elevation);
    testBox.style.setProperty('--amb-thickness', state.thickness);

    // Reset edge styles
    testBox.style.setProperty('--amb-fillet', 0);
    testBox.style.setProperty('--amb-chamfer', 0);
    testBox.style.setProperty('--amb-groove', 0);

    // Apply edge style
    if (state.edge === 'fillet') {
      testBox.style.setProperty('--amb-fillet', 1);
      testBox.style.setProperty('--amb-fillet-w', 2);
    } else if (state.edge === 'chamfer') {
      testBox.style.setProperty('--amb-chamfer', 1);
      testBox.style.setProperty('--amb-chamfer-w', 2);
    } else if (state.edge === 'groove') {
      testBox.style.setProperty('--amb-groove', 1);
      testBox.style.setProperty('--amb-groove-w', 2);
    }

    // Reset emitter
    testBox.style.setProperty('--amb-emitter', 0);

    // Apply emitter
    if (state.emitter !== 'off') {
      testBox.style.setProperty('--amb-emitter', 1);
      testBox.style.setProperty('--amb-emit-i', 0.8);

      if (state.emitter === 'red') {
        testBox.style.setProperty('--amb-emit-r', 255);
        testBox.style.setProperty('--amb-emit-g', 70);
        testBox.style.setProperty('--amb-emit-b', 50);
      } else if (state.emitter === 'green') {
        testBox.style.setProperty('--amb-emit-r', 80);
        testBox.style.setProperty('--amb-emit-g', 255);
        testBox.style.setProperty('--amb-emit-b', 120);
      } else if (state.emitter === 'amber') {
        testBox.style.setProperty('--amb-emit-r', 255);
        testBox.style.setProperty('--amb-emit-g', 180);
        testBox.style.setProperty('--amb-emit-b', 50);
      }
    }
  }

  testOpts.forEach(opt => {
    opt.addEventListener('click', () => {
      const varName = opt.dataset.var;
      const value = opt.dataset.val;

      // Update active state in UI
      const siblings = opt.parentElement.querySelectorAll('.test-opt');
      siblings.forEach(s => s.classList.remove('active'));
      opt.classList.add('active');

      // Update state
      if (varName === 'elevation' || varName === 'thickness') {
        state[varName] = parseInt(value);
      } else {
        state[varName] = value;
      }

      updateTestBox();
    });
  });

  // Initialize test box
  updateTestBox();
});
