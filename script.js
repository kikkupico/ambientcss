const root = document.documentElement;
const body = document.body;

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
  body.classList.remove("theme-day", "theme-night");
  body.classList.add(theme);
}

function setFinish(finish) {
  body.classList.remove("finish-matte", "finish-shiny", "finish-translucent");
  body.classList.add(finish);
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

document.querySelectorAll("[data-finish-controls] button").forEach((button) => {
  button.addEventListener("click", () => {
    const finish = button.dataset.finish;
    setFinish(finish);
    button
      .closest("[data-finish-controls]")
      .querySelectorAll("button")
      .forEach((btn) => btn.classList.remove("is-active"));
    button.classList.add("is-active");
  });
});

const demoBox = document.querySelector("[data-demo-box]");

document.querySelectorAll("[data-control-group]").forEach((group) => {
  const classList = group.dataset.classes
    .split(" ")
    .map((name) => name.trim())
    .filter(Boolean);

  group.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) {
      return;
    }
    classList.forEach((className) => demoBox.classList.remove(className));
    const value = button.dataset.value;
    if (value) {
      demoBox.classList.add(value);
    }
    group.querySelectorAll("button").forEach((btn) => {
      btn.classList.remove("is-active");
    });
    button.classList.add("is-active");
  });
});
