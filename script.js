const root = document.documentElement;

async function sleep(x) {
  return new Promise((resolve) => setTimeout(resolve, x));
}

let wait = Math.round(1600 / 120);

async function animateVar(variable, cond, step) {
  while (cond(parseFloat(getComputedStyle(root).getPropertyValue(variable)))) {
    let curr = parseFloat(getComputedStyle(root).getPropertyValue(variable));
    root.style.setProperty(variable, curr + step);
    await sleep(wait);
  }
}

function setTheme(theme) {
  document.body.classList.remove("theme-day", "theme-night");
  document.body.classList.add(theme);
}

document
  .getElementById("button-day")
  .addEventListener("click", async function setDay() {
    setTheme("theme-day");
    animateVar("--amb-light-x", (val) => val > -1, -1 / 60);
    animateVar("--amb-key-light-intensity", (val) => val < 0.85, 0.3 / 60);
    animateVar("--amb-fill-light-intensity", (val) => val < 0.55, 0.3 / 60);
  });

document
  .getElementById("button-night")
  .addEventListener("click", async function setNight() {
    setTheme("theme-night");
    animateVar("--amb-light-x", (val) => val < 1, 1 / 60);
    animateVar("--amb-key-light-intensity", (val) => val > 0.35, -0.3 / 60);
    animateVar("--amb-fill-light-intensity", (val) => val > 0.1, -0.3 / 60);
  });
