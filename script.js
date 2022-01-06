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
    document.body.style.backgroundColor = "rgb(239,240,242)";
    animateVar("--amb-light-x", (val) => val > -1, -1 / 60);
    animateVar("--amb-key-light-intensity", (val) => val < 0.9, 0.3 / 60);
    animateVar("--amb-fill-light-intensity", (val) => val < 0.6, 0.3 / 60);
  });
document
  .getElementById("button-night")
  .addEventListener("click", async function setDay() {
    document.body.style.backgroundColor = "rgb(36,43,60)";
    animateVar("--amb-light-x", (val) => val < 1, 1 / 60);
    animateVar("--amb-key-light-intensity", (val) => val > 0.3, -0.3 / 60);
    animateVar("--amb-fill-light-intensity", (val) => val > 0, -0.3 / 60);
  });
