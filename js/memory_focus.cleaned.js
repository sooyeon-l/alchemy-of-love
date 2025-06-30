// Memory Focus Overlay Logic
const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

let memoryFocusActive = false;

function pickPoeticPrefix(emotion) {
  const touch = [
    "a touch of",
    "a trace of",
    "a note of",
    "a flicker of",
    "a thread of",
  ];
  const moods = {
    grief: ["a shadow of", "a hush of"],
    awe: ["a tremor of", "a shimmer of"],
    peace: ["a hush of", "a breath of"],
    longing: ["a reach toward", "a thread of"],
    nostalgia: ["a residue of", "a drift of"],
    surprise: ["a burst of", "a crack of"],
    joy: ["a glint of", "a glow of"],
    dread: ["a weight of", "a stillness of"],
    hope: ["a whisper of", "a light of"],
  };
  const list = moods[emotion.toLowerCase()] || touch;
  return list[Math.floor(Math.random() * list.length)];
}

function showMemoryFocus({ text, caption, emotion, timestamp, color }) {
  memoryFocusActive = true;
  const box = document.getElementById("memory-focus");
  const frame = document.getElementById("memory-frame");
  const textEl = document.getElementById("memory-text");
  const emoEl = document.getElementById("memory-emotion");
  const timeEl = document.getElementById("memory-timestamp");

  // Reset content
  textEl.textContent = "";
  const poeticPrefix = pickPoeticPrefix(emotion);
  emoEl.textContent = `${poeticPrefix} ${emotion.toLowerCase()}`;
  timeEl.textContent = timestamp;
  frame.style.borderColor = `rgba(${color.join(",")}, 0.6)`;
  frame.style.setProperty("--orb-color", color.join(","));

  // Animate text reveal
  const fullText = `\"${text}\"\n— ${caption}`;
  let i = 0;
  function type() {
    if (!memoryFocusActive) return;
    textEl.textContent = fullText.slice(0, i++);
    if (i <= fullText.length) setTimeout(type, 18);
  }
  type();

  box.style.display = "flex";
  requestAnimationFrame(() => {
    box.style.opacity = "1";
  });
}

function hideMemoryFocus() {
  memoryFocusActive = false;
  const box = document.getElementById("memory-focus");
  box.style.opacity = "0";
  setTimeout(() => {
    if (!memoryFocusActive) box.style.display = "none";
  }, 400);
  if (isTouchDevice) {
    mouseX = -9999;
    mouseY = -9999;
  }
}
window.showMemoryFocus = showMemoryFocus;
window.hideMemoryFocus = hideMemoryFocus;
