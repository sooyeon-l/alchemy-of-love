let selectedEmotion = null;

function openModal(emotion) {
  selectedEmotion = emotion;

  const modal = document.getElementById("loom-modal");
  const prompt = document.getElementById("modal-prompt");
  const inputBox = document.getElementById("loom-input");

  modal.classList.remove("hidden");

  // ✅ disable pointer events on the canvas
  const canvas = document.querySelector("canvas");
  if (canvas) {
    canvas.style.pointerEvents = "none";
  }

  if (emotion === "warm") {
    prompt.textContent = "🌞 Share a moment or object you remember with love.";
  } else if (emotion === "loss") {
    prompt.textContent =
      "🌑 Share a moment or object you only understood after losing it.";
  }

  setTimeout(() => {
    document.getElementById("loom-input").focus();
  }, 50);
}

window.openModal = openModal;

function closeModal() {
  document.getElementById("loom-modal").classList.add("hidden");
  document.getElementById("loom-input").value = "";
  selectedEmotion = null;

  // ✅ re-enable pointer events
  const canvas = document.querySelector("canvas");
  if (canvas) {
    canvas.style.pointerEvents = "auto";
  }

  // Reset all spools’ modalOpen state
  if (window.loomP5Instance) {
    window.loomP5Instance.selectedSpool = null;
  }
}

window.closeModal = closeModal;

document
  .getElementById("submit-memory-button")
  .addEventListener("click", async () => {
    const memory = document.getElementById("loom-input").value.trim();
    if (!memory) return;

    try {
      // 🧠 Call your AI endpoint
      const res = await fetch("http://localhost:3001/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memory }),
      });

      const data = await res.json();
      const caption = data?.summary || "thread of thought";

      // Pass both memory + caption to p5 sketch
      if (window.loomP5Instance?.submitThread) {
        window.loomP5Instance.submitThread(memory, caption);
      }
    } catch (err) {
      console.error("🛑 AI caption generation failed:", err);
      // fallback:
      window.loomP5Instance.submitThread(memory, "untitled thread");
    }

    closeModal();
  });

document.addEventListener("pointerdown", (e) => {
  const modal = document.getElementById("loom-modal");
  const modalBox = document.querySelector(".loom-modal-content");

  if (
    !modal.classList.contains("hidden") &&
    modalBox &&
    !e.composedPath().includes(modalBox)
  ) {
    closeModal();
    if (window.loomP5Instance?.spools) {
      window.loomP5Instance.spools.forEach(
        (spool) => (spool.modalOpen = false)
      );
    }
  }
});
document.addEventListener("DOMContentLoaded", () => {
  const submitBtn = document.getElementById("submit-memory-button");

  const modalContent = document.querySelector(".loom-modal-content");

  if (modalContent) {
    modalContent.addEventListener("mousedown", (e) => e.stopPropagation());
    modalContent.addEventListener("touchstart", (e) => e.stopPropagation());
  }

  document.addEventListener("mousedown", (e) => {
    const modal = document.getElementById("loom-modal");
    if (
      modal &&
      !modal.classList.contains("hidden") &&
      !modal.contains(e.target)
    ) {
      closeModal();
    }
  });

  document.addEventListener("touchstart", (e) => {
    const modal = document.getElementById("loom-modal");
    if (
      modal &&
      !modal.classList.contains("hidden") &&
      !modal.contains(e.target)
    ) {
      closeModal();
    }
  });
});
