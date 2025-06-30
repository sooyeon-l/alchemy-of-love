// loom.js (p5 instance mode)

export const loomSketch = (p) => {
  let threads = [];
  const PATTERN_PRESETS = {
    softRipple: { waveType: "sin", amp: 2.5, freq: 0.012 },
    braided: { waveType: "cos", amp: 3, freq: 0.01 },
    chaotic: { waveType: "sin+noise", amp: 4.5, freq: 0.02 },
    gentleNoise: { waveType: "noise", amp: 2.2, freq: 0.015 },
  };

  function randomPattern() {
    const waveTypes = ["sin", "cos", "noise", "sin+noise"];
    const waveType = waveTypes[Math.floor(Math.random() * waveTypes.length)];

    let amp, freq;

    if (waveType === "noise") {
      amp = 40 + Math.random() * 30; // bigger jittery variations
      freq = 0.01 + Math.random() * 0.01;
    } else if (waveType === "sin+noise") {
      amp = 50 + Math.random() * 20;
      freq = 0.006 + Math.random() * 0.004;
    } else {
      amp = 35 + Math.random() * 25; // sin or cos
      freq = 0.003 + Math.random() * 0.008;
    }

    return {
      waveType,
      amp,
      freq,
      phase: Math.random() * Math.PI * 2,
    };
  }

  let selectedEmotion = null;
  let spools = [];
  let selectedSpool = null;
  let crochetFont;

  p.preload = function () {
    crochetFont = p.loadFont("assets/fonts/HomemadeApple-Regular.ttf");
  };
  p.setup = function () {
    let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
    canvas.parent("loom-canvas");
    p.noFill();
    p.frameRate(60);

    const headerHeight = 120;
    const goldenY = p.height / 2 + 80;
    const grayY = goldenY + 100;

    spools = [
      new Spool(100, goldenY, "warm", p),
      new Spool(100, grayY, "loss", p),
    ];

    window.loomP5Instance = p;
    p.spools = spools;
  };

  p.draw = function () {
    p.background(17);

    for (let spool of spools) {
      spool.update();
      spool.display();
    }

    p.push();

    // ✨ Subtle loom breathing motion
    const loomPulse = 0.0025 * Math.sin(p.frameCount * 0.008);
    p.scale(1 + loomPulse);

    // 🧵 First pass: even-index threads (under)
    for (let i = 0; i < threads.length; i++) {
      if (i % 2 === 0) {
        let t = threads[i];
        p.push();
        p.strokeWeight(t.strokeWeight || 2);
        p.stroke(...t.color, t.opacity);
        drawThread(t, i); // 👈 pass index
        p.pop();

        t.opacity = p.lerp(
          t.opacity,
          i === threads.length - 1 ? 255 : 100,
          0.05
        );
      }
    }

    // 🧵 Second pass: odd-index threads (over)
    for (let i = 0; i < threads.length; i++) {
      if (i % 2 !== 0) {
        let t = threads[i];
        p.push();
        p.strokeWeight(t.strokeWeight || 2);
        p.stroke(...t.color, t.opacity);
        drawThread(t, i); // 👈 pass index
        p.pop();

        t.opacity = p.lerp(
          t.opacity,
          i === threads.length - 1 ? 255 : 100,
          0.05
        );
      }
    }

    p.pop(); // end scale/push

    // 🧷 Thread hover detection + label
    const mouseXInCanvas = p.mouseX;
    const mouseYInCanvas = p.mouseY;
    let hoveredThread = null;

    for (let thread of threads) {
      for (let pt of thread.points) {
        const d = p.dist(mouseXInCanvas, mouseYInCanvas, pt.x, pt.baseY);
        if (d < 12) {
          hoveredThread = thread;
          break;
        }
      }
      if (hoveredThread) break;
    }

    const label = document.getElementById("thread-hover-label");

    if (hoveredThread && hoveredThread.labelPosition) {
      const { x, y } = hoveredThread.labelPosition;

      const canvasOffset = document
        .getElementById("loom-canvas")
        .getBoundingClientRect();

      label.style.left = `${x + canvasOffset.left}px`;
      label.style.top = `${y + canvasOffset.top}px`;
      label.textContent = `✨ Thread added: ${hoveredThread.caption}`;
      label.classList.remove("hidden");
      label.classList.add("visible");
    } else {
      label.classList.remove("visible");
      setTimeout(() => {
        label.classList.add("hidden");
      }, 300);
    }
    // === Optional Highlight Glow for Hovered Thread
    if (hoveredThread) {
      p.push();
      p.strokeWeight(3.5); // slightly thicker than normal
      p.stroke(...hoveredThread.color, 100);
      p.noFill();
      p.drawingContext.shadowBlur = 12;
      p.drawingContext.shadowColor = p
        .color(...hoveredThread.color, 80)
        .toString();
      drawThread(hoveredThread, -1); // special pass
      p.drawingContext.shadowBlur = 0;

      p.pop();
    }
  };

  p.mousePressed = function () {
    const modal = document.getElementById("loom-modal");
    const modalBox = document.querySelector(".loom-modal-content");

    // ✅ Ignore click/tap if modal is open AND this tap was inside it
    if (
      !modal.classList.contains("hidden") &&
      modalBox &&
      modalBox.contains(document.activeElement)
    ) {
      return;
    }

    let clickedOnSpool = false;

    for (let spool of spools) {
      const dist = p.dist(p.mouseX, p.mouseY, spool.x, spool.y);
      if (dist < 30) {
        clickedOnSpool = true;

        openModal(spool.emotion);
        selectedSpool = spool;

        break;
      }
    }

    // ✅ New: check if mouse click was inside modal DOM
    const clickTarget = document.elementFromPoint(p.mouseX, p.mouseY);

    if (!clickedOnSpool && !modalBox.contains(clickTarget)) {
      closeModal();
      selectedSpool = null;
    }
  };

  p.addThreadFromMemory = function (text) {
    if (!text) return;

    const isWarm = selectedEmotion === "warm"; // or however you track current emotion
    const color = isWarm ? p.color(255, 215, 0) : p.color(180); // gold or gray

    const startX = 150;
    // const startY = isWarm ? p.height / 2 + 80 : p.height / 2 + 180;
    const loomCenter = p.height / 2 + 130;
    const bandHeight = 180;
    const startY = loomCenter + p.random(-bandHeight / 2, bandHeight / 2);

    const screenMidX = p.windowWidth / 2;
    const points = [];

    // 1. 🧵 Leading thread before the text
    for (let x = startX; x < screenMidX - 100; x += 20) {
      const y = startY + p.sin(x * 0.01) * 10;
      points.push({ x, y, baseY: y });
    }

    // 2. ✍️ Text as part of thread
    const caption = text;
    const fontSize = 48;

    const textPoints = crochetFont.textToPoints(
      caption,
      screenMidX - caption.length * fontSize * 0.25, // approximate centering
      startY,
      fontSize,
      {
        sampleFactor: 0.2,
        simplifyThreshold: 0,
      }
    );

    /*
    // Offset each text point vertically to blend with thread wave
    const wovenTextPoints = textPoints.map((pt, i) => {
      const y = pt.y + Math.sin(pt.x * 0.01) * 3;
      return { x: pt.x, y, baseY: pt.y };
    });

    // Append to points
    points.push(...wovenTextPoints);

    // 3. 🧵 Trailing thread after the text
    const lastTextX = wovenTextPoints.at(-1)?.x || screenMidX + 100;
    for (let x = lastTextX + 20; x < p.windowWidth - 20; x += 20) {
      const y = startY + p.sin(x * 0.01) * 10;
      points.push({ x, y, baseY: y });
    }

    const newThread = {
      points,
      color,
      text, // store tthe caption / memory
      startFrame: p.frameCount,
      durationFrames: 900,
    };
    */
    const wovenTextPoints = textPoints.map((pt) => {
      const y = pt.y + Math.sin(pt.x * 0.01) * 2;
      return { x: pt.x, y };
    });

    const newThread = {
      points, // the leading + trailing thread points
      textShape: wovenTextPoints, // the crochet-style caption
      color,
      text,
      startFrame: p.frameCount,
      durationFrames: 900,
    };

    threads.push(newThread);
  };

  function drawThread(thread, index) {
    if (!thread || !thread.points || thread.points.length === 0) {
      console.warn("🚨 Skipping empty thread");
      return;
    }

    const framesElapsed = p.frameCount - thread.startFrame;
    const durationFrames = thread.durationFrames || 360;
    const t = p.constrain(framesElapsed / durationFrames, 0, 1);
    const easedT = t * t * (3 - 2 * t);

    const visibleCount = Math.floor(easedT * thread.points.length);
    const baseAlpha =
      p.map(p.frameCount - thread.startFrame, 0, 3000, 160, 60, true) *
      (index % 2 === 0 ? 0.75 : 1);

    const fabricPulse = Math.sin(p.frameCount * 0.005) * 1.5;

    const col = p.color(...thread.color);
    col.setAlpha(baseAlpha);
    p.stroke(col);
    p.strokeWeight(thread.strokeWeight || 1.5);
    p.noFill();
    p.drawingContext.shadowBlur = 8;
    p.drawingContext.shadowColor = col.toString();

    p.beginShape();

    const pattern = thread.pattern || {
      waveType: "sin",
      amp: 20,
      freq: 0.005,
      phase: 0,
    };
    const { waveType, amp, freq, phase = 0 } = pattern;

    const time = p.frameCount * 0.0015; // 🔁 Slowed down for anchored feel

    for (let i = 0; i < visibleCount; i++) {
      const pt = thread.points[i];
      if (!pt) continue;

      const { x, baseY } = pt;

      const bandOffset = thread.emotion === "warm" ? -20 : 20;

      let offset = 0;
      if (waveType === "noise") {
        offset = (p.noise(x * freq, time) - 0.5) * amp;
      } else if (waveType === "cos") {
        offset = Math.cos(x * freq + time + phase) * amp;
      } else if (waveType === "sin+noise") {
        offset =
          (Math.sin(x * freq + time + phase) +
            (p.noise(x * freq, time) - 0.5)) *
          (amp / 2);
      } else {
        offset = Math.sin(x * freq + time + phase) * amp;
      }

      const y = baseY + offset + bandOffset + fabricPulse;
      p.curveVertex(x, y);
    }

    p.endShape();
    p.drawingContext.shadowBlur = 0;

    // === Draw Poetic Caption Shape ===
    if (thread.textShape && thread.textShape.length > 0) {
      const textVisibleCount = Math.floor(easedT * thread.textShape.length);
      const textTriggerFrame = Math.floor(durationFrames * 0.35);

      if (framesElapsed >= textTriggerFrame) {
        p.stroke(...thread.color, 220);
        p.strokeWeight(1.5);
        p.noFill();
        p.beginShape();
        for (let i = 0; i < textVisibleCount; i++) {
          const pt = thread.textShape[i];
          p.vertex(pt.x, pt.y);
        }
        p.endShape();
      }
    }

    if (thread.caption && !thread.loggedOnce) {
      console.log("✨ Thread added to canvas:", thread.caption);
      thread.loggedOnce = true;
    }
  }

  p.submitThread = function (memoryText, caption = "memory thread") {
    if (!selectedEmotion || !memoryText) return;

    const selectedSpool = spools.find((s) => s.emotion === selectedEmotion);
    if (!selectedSpool) return;

    // 🎨 Dynamic color based on spool preview
    const color =
      selectedSpool.previewStyle?.color ||
      (selectedEmotion === "warm" ? [255, 215, 0] : [150, 150, 160]);
    const strokeWeight = selectedSpool.previewStyle?.weight || 2;

    // 📍 Start position based on preview curve
    const startX = selectedSpool?.previewStart?.[0] - 4 || 100;
    const startY = selectedSpool?.previewStart?.[1] || p.height / 2;
    const screenMidX = p.windowWidth / 2;

    // 1. 🧵 Leading Thread
    const leadingPoints = [];
    let x = startX;
    while (x < screenMidX - 100) {
      const y = startY + p.sin((x - startX) * 0.02 + p.frameCount * 0.01) * 6;
      leadingPoints.push({ x, baseY: y, isLetter: false });
      x += 2;
    }

    const textPoints = crochetFont.textToPoints(
      caption,
      screenMidX - caption.length * 48 * 0.25,
      startY,
      48,
      { sampleFactor: 0.2, simplifyThreshold: 0 }
    );

    const wovenTextPoints = textPoints.map((pt) => ({
      x: pt.x,
      baseY: pt.y + Math.sin(pt.x * 0.01) * 2,
      isLetter: true,
    }));

    // 3. 🧵 Trailing Thread
    const trailingPoints = [];
    let trailX = wovenTextPoints.at(-1)?.x + 2 || screenMidX + 100;
    const endX = p.width + 60;
    while (trailX < endX) {
      const y =
        startY + p.sin((trailX - startX) * 0.02 + p.frameCount * 0.01) * 6;
      trailingPoints.push({ x: trailX, baseY: y, isLetter: false });
      trailX += 2;
    }

    // 5. Combine all points
    const points = [...leadingPoints, ...wovenTextPoints, ...trailingPoints];

    const midIndex = Math.floor(points.length / 2);
    const midPoint = points[midIndex];

    // 6. Final thread object
    threads.push({
      emotion: selectedEmotion,
      memory: caption,
      caption,
      color,
      strokeWeight,
      points,
      opacity: 255,
      startFrame: p.frameCount,
      durationFrames: 360,
      pattern: randomPattern(),
      labelPosition: { x: midPoint.x, y: midPoint.baseY },
    });
    showThreadNote(caption);

    // 🎬 Reset state
    selectedSpool.showPreviewThread = false;
    selectedSpool.hasUnraveled = true;
    selectedEmotion = null;
    closeModal();
  };

  class Spool {
    constructor(x, y, emotion, pInstance) {
      this.x = x;
      this.y = y;
      this.baseY = y;
      this.offset = 0;
      this.driftSpeed = 0.015;
      this.threadAngle = 0;
      this.emotion = emotion;
      this.p = pInstance;
      this.hovered = false;
      this.tapped = false;
      this.shakeTimer = 0;
      this.spoolWidth = 40;
      this.spoolHeight = 80;
      this.topBottomHeight = 12;
      this.hasUnraveled = false;
      this.modalOpen = false;
      this.showPreviewThread = true;
      this.previewStart = 0;
      this.threadTip = 0;
    }

    update() {
      const unravelAmount = this.hovered || this.tapped ? 2.5 : 1;
      const wiggle = p.sin(this.offset * 2) * 10 * unravelAmount;
      const threadPreviewOffset = this.hovered || this.tapped ? 30 : 0;

      this.offset += this.driftSpeed;
      this.y = this.baseY + Math.sin(this.offset) * 5;
      this.threadAngle += 0.05;

      if (this.shakeTimer > 0) {
        this.x += p.random(-2, 2);
        this.shakeTimer--;
      }

      const dist = p.dist(p.mouseX, p.mouseY, this.x, this.y);
      this.hovered = dist < 30;

      if (this.hovered) {
        selectedEmotion = this.emotion;
      }
      const spoolWidth = this.spoolWidth;
      const p0 = [spoolWidth / 2, 0];
      const p1 = [spoolWidth / 2 + 20, 10 + wiggle];
      const p2 = [spoolWidth / 2 + 40, 20 - wiggle];
      const p3 = [spoolWidth / 2 + threadPreviewOffset + 90, 0];

      this.previewThreadPoints = [];
      const steps = 30;
      for (let t = 0; t <= 1; t += 1 / steps) {
        const x = p.bezierPoint(p0[0], p1[0], p2[0], p3[0], t);
        const y = p.bezierPoint(p0[1], p1[1], p2[1], p3[1], t);
        this.previewThreadPoints.push([this.x + x, this.y + y]);
      }

      // ✅ Save start and end
      this.previewStart = this.previewThreadPoints[0]; // First point
      this.threadTip = this.previewThreadPoints.at(-1); // Last point

      if (this.previewThreadPoints.length > 0) {
        const [tipX, tipY] = this.previewThreadPoints.at(-1);
        this.threadTip = { x: tipX, y: tipY };
      }
    }

    display() {
      p.push();
      p.translate(this.x, this.y);

      const isWarm = this.emotion === "warm";
      const woodFill = isWarm ? [165, 100, 40] : [120, 130, 150];
      const bodyFill = isWarm ? [210, 170, 80] : [100, 120, 140];
      const threadStroke = isWarm ? [255, 230, 100] : [180, 200, 220];
      const threadColorBase = isWarm ? [255, 220, 100] : [180, 200, 220];

      const spoolWidth = this.spoolWidth;
      const spoolHeight = this.spoolHeight;
      const topBottomHeight = this.topBottomHeight;

      p.fill(...woodFill);
      p.ellipse(0, -spoolHeight / 2, spoolWidth + 20, topBottomHeight);
      p.ellipse(0, spoolHeight / 2, spoolWidth + 20, topBottomHeight);

      for (let i = -spoolWidth / 2; i <= spoolWidth / 2; i += 1) {
        const alpha = p.map(i, -spoolWidth / 2, spoolWidth / 2, 8, 0);
        p.stroke(255, 255, 255, alpha);
        p.line(i, -spoolHeight / 2, i, spoolHeight / 2);
      }

      p.noStroke();
      p.fill(...bodyFill);
      p.rectMode(p.CENTER);
      p.rect(0, 0, spoolWidth, spoolHeight);

      const numThreads = 15;
      p.stroke(...threadStroke);
      p.strokeWeight(2);
      for (let i = 0; i < numThreads; i++) {
        const y1 = p.map(
          i,
          0,
          numThreads - 1,
          -spoolHeight / 2 + 6,
          spoolHeight / 2 - 6
        );
        const radius = spoolWidth / 2 - 2;
        const phase = i * 0.5 + this.threadAngle;
        const x1 = p.sin(phase) * radius;
        const x2 = p.sin(phase + 1.5) * radius;
        const y2 = y1 + p.random(-1.5, 1.5);

        p.stroke(
          threadColorBase[0] + p.random(-10, 10),
          threadColorBase[1] + p.random(-10, 10),
          threadColorBase[2] + p.random(-10, 10),
          200
        );
        p.line(x1, y1, x2, y2);
      }

      const unravelAmount = this.hovered || this.tapped ? 2.5 : 1;
      const wiggle = p.sin(this.offset * 2) * 10 * unravelAmount;
      const threadLen = 30 * unravelAmount;
      const threadPreviewOffset = this.hovered || this.tapped ? 30 : 0;

      p.stroke(isWarm ? "rgba(255,230,100,1)" : "rgba(180,200,255,1)");
      p.strokeWeight(2);
      p.noFill();
      // === PREVIEW THREAD SETUP ===
      const p0 = [spoolWidth / 2, 0];
      const p1 = [spoolWidth / 2 + 20, 10 + wiggle];
      const p2 = [spoolWidth / 2 + 40, 20 - wiggle];
      const p3 = [spoolWidth / 2 + threadPreviewOffset + 90, 0];

      /*
      // Sample actual points from bezier for reuse
      this.previewThreadPoints = [];
      const steps = 30;
      for (let t = 0; t <= 1; t += 1 / steps) {
        const x = p.bezierPoint(p0[0], p1[0], p2[0], p3[0], t);
        const y = p.bezierPoint(p0[1], p1[1], p2[1], p3[1], t);
        this.previewThreadPoints.push([this.x + x, this.y + y]); // to global coords
      }

      */
      const strokeCol = isWarm ? [255, 230, 100, 255] : [180, 200, 255, 255];
      if (this.showPreviewThread) {
        // Draw preview visually

        p.stroke(...strokeCol);
        p.strokeWeight(2);
        p.noFill();
        p.beginShape();
        p.vertex(p0[0], p0[1]);
        p.bezierVertex(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]);
        p.endShape();
      }
      // Save visual style for thread
      this.previewStyle = {
        color: strokeCol,
        weight: 2,
      };

      p.pop();
    }
  }
};
function showThreadNote(caption) {
  const note = document.getElementById("thread-note");
  if (!note) return;

  note.textContent = `✨ Thread added to canvas: ${caption}`;
  note.classList.remove("hidden");
  note.classList.add("visible");

  setTimeout(() => {
    note.classList.remove("visible");
    setTimeout(() => note.classList.add("hidden"), 600); // wait for fade out
  }, 2800);
}
