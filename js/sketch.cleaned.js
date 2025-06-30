// sketch.js — p5.js instance mode

import { Orb, emotionBehaviors } from "./orb.js";

export const clockSketch = (p) => {
  let orbs = [];

  const defaultMemories = [
    {
      emotion: "joy",
      caption: "The sunlight on our joined shadows.",
      originalText: "When we walked side by side that morning.",
    },
    {
      emotion: "grief",
      caption: "The echo after your ringtone stopped.",
      originalText: "I knew you were gone when the sound didn’t come.",
    },
    {
      emotion: "peace",
      caption: "The hush between two heartbeats.",
      originalText: "We didn’t need words in that moment.",
    },
  ];

  p.setup = function () {
    const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
    canvas.parent("clock-canvas");
    p.noStroke();
  };

  p.draw = function () {
    p.background(10, 10, 15, 100);
    p.blendMode(p.ADD);

    let hoveredOrb = null;
    for (let orb of orbs) {
      orb.update(p);
      if (!hoveredOrb && orb.checkHover(p.mouseX, p.mouseY, p)) {
        hoveredOrb = orb;
      } else {
        orb.hovered = false;
      }
    }

    for (let orb of orbs) {
      orb.display(p);
    }

    p.blendMode(p.BLEND);
  };

  p.windowResized = function () {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };

  p.mousePressed = function () {
    if (!("ontouchstart" in window || navigator.maxTouchPoints > 0)) return;

    for (let orb of orbs) {
      const x = p.width / 2 + p.cos(orb.angle) * orb.orbitRadius;
      const y = p.height / 2 + p.sin(orb.angle) * orb.orbitRadius;
      const pulse = p.sin(orb.pulsePhase) * orb.pulseSize;
      const orbSize = orb.baseSize + pulse;
      const d = p.dist(p.mouseX, p.mouseY, x, y);

      if (d < orbSize / 2) {
        showMemoryFocus({
          text: orb.originalText,
          caption: orb.caption,
          emotion: orb.emotion,
          timestamp: orb.timestamp,
          color: orb.color,
        });
        return;
      }
    }

    hideMemoryFocus();
  };

  function addOrbUsingFracturedCircle(emotion, caption, originalText) {
    let attempts = 0;
    let angle, orbitRadius, size;
    const maxAttempts = 100;

    do {
      angle = p.random(p.TWO_PI);
      orbitRadius = p.random(150, 400);
      size = p.random(30, 50);

      let overlaps = false;
      for (let orb of orbs) {
        const dx =
          p.cos(angle) * orbitRadius - p.cos(orb.angle) * orb.orbitRadius;
        const dy =
          p.sin(angle) * orbitRadius - p.sin(orb.angle) * orb.orbitRadius;
        const distSq = dx * dx + dy * dy;
        const minDist = (size + orb.baseSize) * 0.75;
        if (distSq < minDist * minDist) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) break;
      attempts++;
    } while (attempts < maxAttempts);

    orbs.push(
      new Orb(angle, orbitRadius, size, emotion, caption, originalText, p)
    );
  }
  p.addOrbUsingFracturedCircle = addOrbUsingFracturedCircle;
};
