// transmutation_mirror.js (The Final Vision - Corrected)

export const transmutationMirror = (p) => {
  let cracks = [];
  let canvasContainer;
  let font;

  let interactionLog = {};
  let totalDamage = 0;
  const SHATTER_THRESHOLD = 12.0;
  let state = "drawing"; // 'drawing', 'finalCrackening', 'rumbling', 'lightSwell', 'glowReceding', 'revealing'

  let finaleProgress = 0;
  let canCrack = true;

  // --- Buffers for advanced rendering ---
  let baseLayer; // For the static stone circle + noise
  let crackLayer; // For drawing the cracks
  let textLayer; // For the final revealed text
  let finalRevealText;
  let textIsReady = false;
  let hasRequestedInsight = false;

  p.preload = () => {
    font = p.loadFont("assets/fonts/HomemadeApple-Regular.ttf");
  };

  p.setup = () => {
    canvasContainer = p.select("#mirror-canvas");
    const canvas = p.createCanvas(
      canvasContainer.width,
      canvasContainer.height
    );
    canvas.parent("mirror-canvas");

    baseLayer = p.createGraphics(p.width, p.height);
    crackLayer = p.createGraphics(p.width, p.height);
    textLayer = p.createGraphics(p.width, p.height);

    resetSketch();
  };

  const resetSketch = () => {
    textIsReady = false;
    hasRequestedInsight = false;
    finalRevealText = null;
    textIsReady = false;

    finalRevealText = null;
    textLayer.clear();

    cracks = [];
    state = "drawing";
    finaleProgress = 0;
    canCrack = true;
    finalRevealText = null;

    interactionLog = {
      clicks: [],
      drags: [],
      pauses: [],
      startTime: p.millis(),
      lastInteractionTime: p.millis(),
    };
    totalDamage = 0;

    drawBaseLayer();
    crackLayer.clear();
    textLayer.clear();
  };

  const drawBaseLayer = () => {
    baseLayer.fill(10, 8, 3);
    baseLayer.noStroke();
    baseLayer.circle(p.width / 2, p.height / 2, p.width);

    baseLayer.push();
    for (let i = 0; i < 15000; i++) {
      const x = baseLayer.random(p.width);
      const y = baseLayer.random(p.height);
      const d = baseLayer.dist(x, y, p.width / 2, p.height / 2);
      if (d < p.width / 2) {
        const alpha = baseLayer.random(0.01, 0.1);
        baseLayer.stroke(`rgba(5, 4, 1, ${alpha})`);
        baseLayer.point(x, y);
      }
    }
    baseLayer.pop();
  };

  p.draw = () => {
    p.background(5, 4, 1);

    // --- Corrected State Machine Logic ---
    if (state === "finalCrackening") {
      if (p.frameCount % 5 === 0 && cracks.length < 90) {
        let originCrack = p.random(cracks);
        if (!originCrack) return;
        let originPoint = p.random(originCrack.points);

        let newEnergy = originCrack.energy * 0.95;
        if (newEnergy > 0.1) {
          const newCrack = new Crack(
            originPoint.x,
            originPoint.y,
            p.random(p.TWO_PI),
            newEnergy
          );
          newCrack.maxPoints = p.width * 1.5;
          cracks.push(newCrack);
          newCrack.draw();
        }
      }
      // When cracking is done, start the rumble
      if (cracks.length >= 90) {
        state = "rumbling";
        setTimeout(() => {
          state = "lightSwell";
          displayInsight();
        }, 1500); // Rumble for 1.5 seconds
      }
    }

    // Always draw the base and crack layers unless the finale is over
    if (state !== "revealing") {
      p.image(baseLayer, 0, 0);
      p.image(crackLayer, 0, 0);
    }

    if (state === "rumbling") {
      let rumbleX = p.random(-3, 3);
      let rumbleY = p.random(-3, 3);
      canvasContainer.style(
        "transform",
        `translate(${rumbleX}px, ${rumbleY}px)`
      );
    } else {
      canvasContainer.style("transform", `translate(0px, 0px)`);
    }

    if (state === "lightSwell") {
      finaleProgress = p.min(finaleProgress + 0.01, 1);

      const glowSize = p.width * 2.2 * p.pow(finaleProgress, 2);
      const glowAlpha = 0.98 * finaleProgress;

      const grad = p.drawingContext.createRadialGradient(
        p.width / 2,
        p.height / 2,
        0,
        p.width / 2,
        p.height / 2,
        glowSize
      );
      grad.addColorStop(0, `rgba(255, 220, 180, ${glowAlpha})`);
      grad.addColorStop(0.5, `rgba(255, 180, 100, ${glowAlpha * 0.5})`);
      grad.addColorStop(1, `rgba(255, 160, 80, 0)`);
      p.drawingContext.fillStyle = grad;
      p.noStroke();
      p.rect(0, 0, p.width, p.height);

      if (finaleProgress >= 1) {
        // ✅ Glow now covers screen fully — remove cracks and prep text
        crackLayer.clear();
        displayInsight(); // ensure text is ready BEFORE receding glow
        state = "glowReceding";
      }
    } else if (state === "glowReceding") {
      // Step 1: Draw the text under the glow
      if (finalRevealText && textIsReady) {
        finalRevealText.drawFinalToBuffer(textLayer);
      }
      p.image(textLayer, 0, 0); // Draw it under the glow

      // Step 2: Receding veil effect (black returns)
      const safeProgress = p.max(0, finaleProgress);
      const glowSize = p.width * 2.2 * p.pow(safeProgress, 0.5);

      const grad = p.drawingContext.createRadialGradient(
        p.width / 2,
        p.height / 2,
        0,
        p.width / 2,
        p.height / 2,
        glowSize
      );
      grad.addColorStop(0, `rgba(5, 4, 1, 0)`); // Center: transparent (shows text)
      grad.addColorStop(0.8, `rgba(5, 4, 1, 1)`); // Edge: dark returns
      grad.addColorStop(1, `rgba(5, 4, 1, 1)`);
      p.drawingContext.fillStyle = grad;
      p.noStroke();
      p.rect(0, 0, p.width, p.height);

      // Step 3: Progressively recede the glow
      finaleProgress -= 0.005;
      finaleProgress = p.constrain(finaleProgress, 0, 1);

      // Step 4: Final transition to "revealing"
      if (finaleProgress <= 0.001) {
        finaleProgress = 0;
        state = "revealing";
        return; // Prevent any last-frame flash of glow
      }
    }

    if (state === "revealing" && finalRevealText && textIsReady) {
      finalRevealText.drawFinal();
    }

    // Hover Pause Detection
    if (
      !p._lastHoverPos ||
      p.dist(p.mouseX, p.mouseY, p._lastHoverPos.x, p._lastHoverPos.y) > 20
    ) {
      p._lastHoverPos = { x: p.mouseX, y: p.mouseY };
      p._hoverStartTime = p.millis();
    } else {
      const hoverDuration = p.millis() - (p._hoverStartTime || 0);
      if (hoverDuration > 1000) {
        interactionLog.pauses.push({
          x: p.mouseX,
          y: p.mouseY,
          duration: hoverDuration,
          time: p.millis(),
        });
        p._hoverStartTime = p.millis() + 999999; // avoid re-logging
      }
    }
  };
  p.mouseDragged = () => {
    const now = p.millis();
    interactionLog.drags.push({
      x: p.mouseX,
      y: p.mouseY,
      time: now,
    });
  };

  const checkShatterCondition = () => {
    if (totalDamage > SHATTER_THRESHOLD && state === "drawing") {
      triggerShatterSequence();
    }
  };

  const triggerShatterSequence = () => {
    state = "finalCrackening";
    canCrack = false; // Disable user cracking
  };

  const wordWrap = (text, maxWidth, size) => {
    p.textFont(font);
    p.textSize(size);
    const words = text.split(" ");
    let lines = [];
    let currentLine = words[0] || "";

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const currentBounds = font.textBounds(
        currentLine + " " + word,
        0,
        0,
        size
      );
      if (currentBounds.w < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines.join("\n");
  };

  const displayInsight = async () => {
    if (hasRequestedInsight) {
      console.log("⚠️ Insight already requested — skipping duplicate.");
      return;
    }
    hasRequestedInsight = true;

    const summary = synthesizeInteraction();
    console.log("🧠 Calling OpenAI insight with summary:\n", summary);

    try {
      const response = await fetch("http://localhost:3001/api/mirror-insight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ interactionSummary: summary }),
      });

      const result = await response.json();

      if (result.insight) {
        const temp = new FinalText(result.insight, p.width / 2, p.height / 2);
        finalRevealText = temp;
        textIsReady = true;
      }
    } catch (err) {
      console.error("Mirror insight API call failed:", err);
      finalRevealText = null;
      textIsReady = false;
    }
  };

  const synthesizeInteraction = () => {
    const total = interactionLog.clicks.length;
    const dragTotal = interactionLog.drags.length;
    const pauseTotal = interactionLog.pauses.length;

    const delays = interactionLog.clicks.map((c) => c.delaySinceLast);
    const avgDelay = delays.length
      ? delays.reduce((a, b) => a + b, 0) / delays.length
      : 0;

    const clustered = interactionLog.clicks.filter(
      (c) => c.delaySinceLast < 300
    );
    const spacedOut = interactionLog.clicks.filter(
      (c) => c.delaySinceLast > 1000
    );

    const longPauses = interactionLog.pauses.filter((p) => p.duration > 2000);

    return `
User interaction summary:
- ${total} cracks
- ${clustered.length} clustered (rapid)
- ${spacedOut.length} slow and spaced
- ${pauseTotal} significant hover pauses
- ${longPauses.length} were longer than 2 seconds
- ${dragTotal} drag movements
- Avg delay between actions: ${avgDelay.toFixed(0)}ms
- Total duration: ${(p.millis() - interactionLog.startTime).toFixed(0)}ms
`;
  };

  const logInteraction = () => {
    const now = p.millis();
    const timeSinceLast = now - interactionLog.lastInteractionTime;
    interactionLog.lastInteractionTime = now;

    interactionLog.clicks.push({
      x: p.mouseX,
      y: p.mouseY,
      time: now,
      delaySinceLast: timeSinceLast,
    });
  };

  p.mousePressed = () => {
    if (state !== "drawing" || !canCrack) return;
    logInteraction();

    const d = p.dist(p.mouseX, p.mouseY, p.width / 2, p.height / 2);
    if (d > (p.width / 2) * 0.95) return;

    const clickThreshold = 15;
    let onExistingCrack = false;

    for (const crack of cracks) {
      for (const point of crack.points) {
        if (p.dist(p.mouseX, p.mouseY, point.x, point.y) < clickThreshold) {
          onExistingCrack = true;
          const newEnergy = crack.energy * 0.9;
          if (newEnergy > 0.1) {
            const newCrack = new Crack(
              point.x,
              point.y,
              p.random(p.TWO_PI),
              newEnergy
            );
            cracks.push(newCrack);
            newCrack.draw();
            totalDamage += newEnergy;
          }
          checkShatterCondition();
          return;
        }
      }
    }

    if (!onExistingCrack) {
      const angle = p.random(p.TWO_PI);
      const energy = 1.0;
      const mainCrack = new Crack(p.mouseX, p.mouseY, angle, energy);
      const minorCrack = new Crack(p.mouseX, p.mouseY, angle + p.PI, energy);
      minorCrack.maxPoints = p.random(15, 30);
      minorCrack.isMinor = true;

      cracks.push(mainCrack, minorCrack);
      mainCrack.draw();
      minorCrack.draw();

      totalDamage += energy * 1.1;
      checkShatterCondition();
    }

    canCrack = false;
    setTimeout(() => {
      canCrack = true;
    }, 300);
  };

  p.doubleClicked = () => {
    if (state === "revealing") {
      resetSketch();
    }
  };

  class FinalText {
    constructor(text, x, y) {
      this.x = x;
      this.y = y;
      let fixedSize = 28;
      p.textFont(font);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(fixedSize);

      let formattedText = wordWrap(text, p.width * 0.7, fixedSize);

      let bounds = font.textBounds(formattedText, this.x, this.y, fixedSize);
      while (bounds.w > p.width * 0.7 || bounds.h > p.height * 0.7) {
        fixedSize *= 0.95;
        p.textSize(fixedSize);
        formattedText = wordWrap(text, p.width * 0.7, fixedSize);
        bounds = font.textBounds(formattedText, this.x, this.y, fixedSize);
      }
      this.text = formattedText;
      this.size = fixedSize;
    }
    drawFinalToBuffer(buffer) {
      buffer.clear();
      buffer.push();
      buffer.fill(255, 240, 200, 255); // Fully opaque for masking
      buffer.noStroke();
      buffer.textFont(font);
      buffer.textSize(this.size);
      buffer.textAlign(p.CENTER, p.CENTER);
      buffer.text(this.text, buffer.width / 2, buffer.height / 2);
      buffer.pop();
    }
    drawFinal() {
      p.push();
      p.fill(255, 240, 200, 220);
      p.noStroke();
      p.textFont(font);
      p.textSize(this.size);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(this.text, p.width / 2, p.height / 2);
      p.pop();
    }
  }

  // --- REVISED CRACK CLASS FOR INSTANT "BAM" DRAWING ---
  class Crack {
    constructor(x, y, angle, energy) {
      this.pos = p.createVector(x, y);
      this.origin = this.pos.copy();
      this.energy = energy;
      this.isMinor = false;

      this.maxPoints = p.random(80, 200) * this.energy;
      this.points = this.generatePath(x, y, angle, this.maxPoints);
    }

    generatePath(startX, startY, startAngle, maxLen) {
      let path = [];
      let currentPos = p.createVector(startX, startY);
      let vel = p5.Vector.fromAngle(startAngle, 0.95);
      let turnCooldown = 0;
      let straightness = p.random(30, 40);

      for (let i = 0; i < maxLen; i++) {
        path.push(currentPos.copy());

        turnCooldown++;
        if (turnCooldown > straightness) {
          const turnMagnitude = p.map(
            this.energy,
            1.0,
            0.0,
            p.PI / 8,
            p.PI / 5,
            true
          );
          const turnAngle = p.randomGaussian(0, turnMagnitude);
          vel.rotate(turnAngle);
          turnCooldown = 0;
          straightness = p.random(30, 40);
        }

        const jitterMagnitude = 0.3;
        const jitter = p5.Vector.random2D().mult(jitterMagnitude);
        let stepVelocity = p5.Vector.add(vel, jitter);
        stepVelocity.normalize().mult(0.95);
        currentPos.add(stepVelocity);

        // --- BRANCHING LOGIC IS NOW PART OF GENERATION ---
        const branchChance = this.isMinor ? 0 : 0.08 * p.pow(this.energy, 3);
        if (
          i > 20 &&
          i < maxLen * 0.8 &&
          cracks.length < 100 &&
          p.random(1) < branchChance
        ) {
          const newEnergy = this.energy * p.random(0.4, 0.6);
          if (newEnergy > 0.08) {
            const newAngle = vel.heading() + p.random(-p.PI / 2, p.PI / 2);
            const newCrack = new Crack(
              currentPos.x,
              currentPos.y,
              newAngle,
              newEnergy
            );
            cracks.push(newCrack);
            newCrack.draw();
          }
        }

        const d = p.dist(currentPos.x, currentPos.y, p.width / 2, p.height / 2);
        if (d > (p.width / 2) * 0.98) break;
      }
      return path;
    }

    draw() {
      this.drawImpactGlow();
      this.points.forEach((pt, i) => {
        if (i > 0) {
          this.drawSegment(this.points[i - 1], pt, i);
        }
      });
    }

    drawImpactGlow() {
      crackLayer.push();
      let grad = crackLayer.drawingContext.createRadialGradient(
        this.origin.x,
        this.origin.y,
        0,
        this.origin.x,
        this.origin.y,
        200 * this.energy
      );
      grad.addColorStop(0, `rgba(160, 100, 30, ${0.2 * this.energy})`);
      grad.addColorStop(1, "rgba(160, 100, 30, 0)");
      crackLayer.drawingContext.fillStyle = grad;
      crackLayer.noStroke();
      crackLayer.rect(0, 0, p.width, p.height);
      crackLayer.pop();
    }

    drawSegment(p1, p2, i) {
      crackLayer.push();
      const easedEnergy = p.pow(this.energy, 3);
      const lengthMultiplier = p.map(i, 0, this.points.length, 1, 0.05, true);
      const baseBlurAmount = p.map(easedEnergy, 1.0, 0.0, 40, 3, true);
      const baseAlpha = p.map(easedEnergy, 1.0, 0.0, 1.0, 0.1, true);
      const baseCoreWeight = p.map(easedEnergy, 1.0, 0.0, 2.7, 0.1, true);
      const dynamicBlur = baseBlurAmount * lengthMultiplier;
      const dynamicAlpha = baseAlpha * lengthMultiplier;
      const dynamicWeight = baseCoreWeight * lengthMultiplier;

      crackLayer.drawingContext.shadowBlur = dynamicBlur;
      crackLayer.drawingContext.shadowColor = `rgba(255, 180, 50, ${dynamicAlpha})`;
      crackLayer.stroke(255, 255, 240);
      crackLayer.strokeWeight(p.max(dynamicWeight, 0.1));
      crackLayer.strokeCap(p.SQUARE);

      crackLayer.line(p1.x, p1.y, p2.x, p2.y);
      crackLayer.pop();
    }
  }

  p.windowResized = () => {
    p.resizeCanvas(canvasContainer.width, canvasContainer.height);
    resetSketch();
  };
};
