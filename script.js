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

document
  .getElementById("button-day")
  .addEventListener("click", async function setDay() {
    animateVar("--amb-light-x", (val) => val > -1, -1 / 60);
    animateVar("--amb-key-light-intensity", (val) => val < 0.9, 0.6 / 60);
    animateVar("--amb-fill-light-intensity", (val) => val < 0.7, 0.6 / 60);
  });
document
  .getElementById("button-night")
  .addEventListener("click", async function setNight() {
    animateVar("--amb-light-x", (val) => val < 1, 1 / 60);
    animateVar("--amb-key-light-intensity", (val) => val > 0.3, -0.6 / 60);
    animateVar("--amb-fill-light-intensity", (val) => val > 0.1, -0.6 / 60);
  });
