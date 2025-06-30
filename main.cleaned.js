import { loomSketch } from "./js/loom.js";
import { clockSketch } from "./js/sketch.js";
import { transmutationMirror } from "./js/transmutation_mirror.js";

function enterExhibition(id) {
  const landing = document.getElementById("landing");
  landing.classList.add("opacity-0", "pointer-events-none");

  setTimeout(() => {
    landing.style.display = "none";
    const section = document.getElementById(id);
    if (section) section.classList.remove("hidden");
    document.getElementById("back-btn-wrapper").classList.remove("hidden");
    section?.scrollIntoView({ behavior: "smooth" });

    if (id === "clock" && !window.clockLoaded) {
      window.clockSketchInstance = new p5(clockSketch);
      window.clockLoaded = true;
    }

    if (id === "loom" && !window.loomLoaded) {
      window.loomSketchInstance = new p5(loomSketch);
      window.loomLoaded = true;
    }

    if (id === "mirror" && !window.mirrorLoaded) {
      window.mirrorSketchInstance = new p5(
        transmutationMirror,
        "mirror-canvas"
      );
      window.mirrorLoaded = true;
    }

    if (id === "loom") {
      const modal = document.getElementById("loom-modal");
      const input = document.getElementById("loom-modal-input");
      const button = document.getElementById("loom-modal-submit");
      if (modal && input && button) {
        button.onclick = () => {
          const value = input.value.trim();
          if (value && window.loomSketchInstance) {
            window.loomSketchInstance.submitThread(value);
            modal.classList.add("hidden");
            input.value = "";
          }
        };
      }
    }

    if (id === "clock") {
      const header = document.getElementById("memory-header");
      if (header) {
        header.addEventListener("click", toggleMemoryCard);
      }
    }
  }, 800);
}

function returnToGallery() {
  const landing = document.getElementById("landing");
  document.querySelectorAll(".fade-section").forEach((sec) => {
    sec.classList.add("hidden");
  });
  landing.style.display = "flex";
  setTimeout(() => {
    landing.classList.remove("opacity-0", "pointer-events-none");
    window.scrollTo({ top: 0, behavior: "instant" });
  }, 50);
  document.getElementById("back-btn-wrapper").classList.add("hidden");
  document.getElementById("thread-hover-label")?.classList.add("hidden");
}

function toggleMemoryCard() {
  const body = document.getElementById("memory-body");
  const card = document.getElementById("memory-card");
  const isExpanded = body.classList.contains("max-h-96");

  if (isExpanded) {
    body.classList.remove("opacity-100", "max-h-96", "py-4");
    body.classList.add("opacity-0", "max-h-0");

    card.classList.remove("w-[600px]");
    card.classList.add("w-[250px]");
  } else {
    body.classList.remove("opacity-0", "max-h-0");
    body.classList.add("opacity-100", "max-h-96", "py-4");

    card.classList.remove("w-[250px]");
    card.classList.add("w-[600px]");
  }
}

document.querySelectorAll("[data-section]").forEach((el) => {
  el.addEventListener("click", () => {
    const section = el.getAttribute("data-section");
    enterExhibition(section);
  });
});

document.addEventListener("click", function (event) {
  const card = document.getElementById("memory-card");
  const body = document.getElementById("memory-body");
  const isExpanded = body.classList.contains("max-h-96");

  if (!isExpanded) return;

  if (!card.contains(event.target)) {
    body.classList.remove("opacity-100", "max-h-96", "py-4");
    body.classList.add("opacity-0", "max-h-0");

    card.classList.remove("w-[600px]");
    card.classList.add("w-[250px]");
  }
});

async function analyzeMemory(memoryText) {
  const response = await fetch("http://localhost:3001/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memory: memoryText }),
  });

  const data = await response.json();
  return data;
}

window.onload = function () {
  const form = document.getElementById("memory-form");

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const memoryText = document.getElementById("memory-input").value;
    if (!memoryText) return;

    try {
      const data = await analyzeMemory(memoryText);

      if (data.emotion && data.caption) {
        const emotion = data.emotion?.toLowerCase?.();
        window.clockSketchInstance.addOrbUsingFracturedCircle(
          emotion,
          data.caption,
          memoryText
        );
        document.getElementById(
          "memory-response"
        ).textContent = `🪞 ${data.caption} — a trace of ${emotion}`;
        toggleMemoryCard();
      } else {
        document.getElementById(
          "memory-response"
        ).textContent = `⚠️ Failed to generate orb. Debug info: ${JSON.stringify(
          data
        )}`;
      }

      form.reset();
    } catch (err) {
      console.error(err);
      document.getElementById("memory-response").textContent =
        "❌ Error connecting to AI server.";
    }
  });
};

const grayShades = [
  "#0f0f0f",
  "#1a1a1a",
  "#222222",
  "#2c2c2c",
  "#333333",
  "#3a3a3a",
  "#444444",
];
const dotIds = ["dot-clock", "dot-loom", "dot-mirror"];

const dotElements = dotIds.map((id) => document.getElementById(id));

function getDarkGray(min = 5, max = 40) {
  const v = Math.floor(Math.random() * 60) + 10;
  return `rgb(${v}, ${v}, ${v})`;
}

function generateUniqueShades(count) {
  const shades = new Set();
  while (shades.size < count) {
    shades.add(getDarkGray());
  }
  return [...shades];
}

function animateDotColors() {
  const newShades = generateUniqueShades(dotElements.length);
  dotElements.forEach((el, i) => {
    if (el) el.style.backgroundColor = newShades[i];
  });
  requestAnimationFrame(animateDotColors);
}

animateDotColors();
window.enterExhibition = enterExhibition;
window.returnToGallery = returnToGallery;
