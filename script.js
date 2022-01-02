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
    document.body.style.backgroundColor = "hsl(20, 20%, 95%)";
    animateVar("--amb-light-x", (val) => val > -1, -1 / 60);
    animateVar("--amb-key-light-intensity", (val) => val < 0.9, 0.6 / 20);
    animateVar("--amb-fill-light-intensity", (val) => val < 0.6, 0.6 / 20);
  });
document
  .getElementById("button-night")
  .addEventListener("click", async function setDay() {
    document.body.style.backgroundColor = "hsl(240, 20%, 15%)";
    animateVar("--amb-light-x", (val) => val < 1, 1 / 60);
    animateVar("--amb-key-light-intensity", (val) => val > 0.3, -0.6 / 20);
    animateVar("--amb-fill-light-intensity", (val) => val > 0, -0.6 / 20);
  });
