
export const emotionBehaviors = {
  joy: {
    pulseSpeed: 0.015,
    pulseSize: 4,
    glow: true,
    color: [255, 220, 80],
    trailColors: [
      [255, 220, 80],
      [255, 170, 100],
      [255, 255, 180],
    ],
  },
  grief: {
    pulseSpeed: 0.005,
    pulseSize: 2,
    glow: false,
    color: [90, 90, 120],
    trailColors: [
      [80, 80, 110],
      [60, 60, 100],
      [100, 100, 130],
    ],
  },
  awe: {
    pulseSpeed: 0.01,
    pulseSize: 4,
    glow: true,
    color: [180, 170, 255],
    trailColors: [
      [200, 180, 255],
      [160, 160, 240],
      [220, 210, 255],
    ],
  },
  longing: {
    pulseSpeed: 0.006,
    pulseSize: 3,
    glow: true,
    color: [255, 180, 200],
    trailColors: [
      [255, 200, 210],
      [240, 160, 180],
      [220, 140, 180],
    ],
  },
  nostalgia: {
    pulseSpeed: 0.007,
    pulseSize: 3,
    glow: false,
    color: [210, 180, 130],
    trailColors: [
      [230, 200, 160],
      [200, 170, 140],
      [180, 150, 120],
    ],
  },
  serenity: {
    pulseSpeed: 0.004,
    pulseSize: 3,
    glow: true,
    color: [180, 255, 220],
    trailColors: [
      [160, 240, 200],
      [200, 255, 230],
      [150, 230, 210],
    ],
  },
  dread: {
    pulseSpeed: 0.028,
    pulseSize: 2,
    glow: false,
    color: [50, 10, 20],
    trailColors: [
      [60, 20, 30],
      [40, 0, 10],
      [70, 10, 20],
    ],
  },
  surprise: {
    pulseSpeed: 0.045,
    pulseSize: 5,
    glow: true,
    color: [255, 100, 230],
    trailColors: [
      [255, 140, 240],
      [240, 180, 250],
      [220, 100, 200],
    ],
  },
  bittersweet: {
    pulseSpeed: 0.009,
    pulseSize: 3,
    glow: true,
    color: [200, 140, 180],
    trailColors: [
      [220, 160, 190],
      [180, 120, 160],
      [210, 130, 170],
    ],
  },
  wonder: {
    pulseSpeed: 0.012,
    pulseSize: 4,
    glow: true,
    color: [140, 200, 255],
    trailColors: [
      [160, 220, 255],
      [180, 240, 255],
      [130, 190, 250],
    ],
  },
  melancholy: {
    pulseSpeed: 0.006,
    pulseSize: 3,
    glow: false,
    color: [120, 130, 160],
    trailColors: [
      [110, 120, 150],
      [90, 100, 140],
      [100, 110, 130],
    ],
  },
};

const defaultBehavior = {
  pulseSpeed: 0.01,
  pulseSize: 2,
  glow: false,
  color: [180, 180, 180],
  trailColors: [
    [180, 180, 180],
    [220, 220, 240],
    [100, 100, 100],
  ],
};

function mapEmoToOffset(emotion) {
  switch (emotion) {
    case "joy":
      return (Math.random() * (0.015 - 0.005) + 0.005) * 0.2;
    case "grief":
      return (Math.random() * (0.02 - 0.01) + 0.01) * 0.2;
    case "awe":
      return (Math.random() * (0.02 - 0.008) + 0.008) * 0.2;
    case "longing":
      return (Math.random() * (0.007 - 0.003) + 0.003) * 0.2;
    case "nostalgia":
      return (Math.random() * 0.01 - 0.005) * 0.2;
    case "surprise":
      return (Math.random() * (0.05 - 0.04) + 0.04) * 0.2;
    case "dread":
      return (Math.random() * (0.03 - 0.025) + 0.025) * 0.2;
    case "peace":
      return (Math.random() * (0.005 - 0.002) + 0.002) * 0.2;
    case "hope":
      return (Math.random() * (0.01 - 0.005) + 0.005) * 0.2;
    default:
      return (Math.random() * (0.01 - 0.004) + 0.004) * 0.2;
  }
}

export class Orb {
  constructor(angle, orbitRadius, baseSize, emotion, caption, originalText, p) {
    this.angle = angle;
    this.orbitRadius = orbitRadius;
    this.baseSize = baseSize;
    this.emotion = emotion;
    this.caption = caption;
    this.originalText = originalText;
    this.timestamp = new Date().toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    this.angleOffset = mapEmoToOffset(this.emotion);
    const behavior = emotionBehaviors[this.emotion] || defaultBehavior;
    this.color = behavior.color;
    this.trailColors = behavior.trailColors;
    this.pulseSpeed = behavior.pulseSpeed;
    this.pulseSize = behavior.pulseSize;
    this.glow = behavior.glow;

    this.pulsePhase = 0;
    this.trail = [];
    this.hovered = false;
    this.opacity = 255;

    this.glowTexture = p.createGraphics(baseSize * 6, baseSize * 6);
    this.glowTexture.clear();
    this.glowTexture.noStroke();
    for (let i = this.glowTexture.width; i > 0; i -= 2) {
      const alpha = p.map(i, this.glowTexture.width, 0, 0, 20);
      this.glowTexture.fill(...this.color, alpha);
      this.glowTexture.ellipse(
        this.glowTexture.width / 2,
        this.glowTexture.height / 2,
        i
      );
    }
    this.glowTexture.filter(p.BLUR, 4);
  }

  update(p) {
    if (!this.hovered) {
      this.angle += this.pulseSpeed * 0.2;
    }
    this.pulsePhase += this.pulseSpeed;

    const x = p.width / 2 + Math.cos(this.angle) * this.orbitRadius;
    const y = p.height / 2 + Math.sin(this.angle) * this.orbitRadius;
    this.trail.push([x, y]);
    if (this.trail.length > 200) this.trail.shift();
  }

  display(p) {
    const pulse = Math.sin(this.pulsePhase) * this.pulseSize;
    const x = p.width / 2 + Math.cos(this.angle) * this.orbitRadius;
    const y = p.height / 2 + Math.sin(this.angle) * this.orbitRadius;
    const orbSize = this.baseSize + pulse;

    p.push();
    p.blendMode(p.ADD);
    for (let i = 0; i < this.trail.length - 1; i++) {
      const [x1, y1] = this.trail[i];
      const [x2, y2] = this.trail[i + 1];
      const t = i / this.trail.length;
      const col = this.trailColors[i % this.trailColors.length];
      const r = p.lerp(col[0], this.color[0], 1 - t);
      const g = p.lerp(col[1], this.color[1], 1 - t);
      const b = p.lerp(col[2], this.color[2], 1 - t);
      const alpha = p.lerp(0, 2, t);
      p.stroke(r, g, b, alpha);
      const startW = orbSize * 0.1; // thickness near orb
      const endW = orbSize * 0.35; // thin at end
      p.strokeWeight(p.lerp(startW, endW, t));

      p.line(x1, y1, x2, y2);
    }
    p.pop();

    // Glow aura
    if (this.glowTexture) {
      p.push();
      p.imageMode(p.CENTER);
      p.blendMode(p.ADD);
      const glowAlpha =
        p.map(Math.sin(this.pulsePhase), -1, 1, 40, 220) * (this.opacity / 255);
      p.tint(...this.color, glowAlpha);
      p.image(this.glowTexture, x, y);
      p.pop();
    }

    // Core orb
    p.noStroke();
    p.fill(...this.color, 180);
    p.ellipse(x, y, orbSize * 0.65);
  }

  checkHover(mx, my, p) {
    const x = p.width / 2 + Math.cos(this.angle) * this.orbitRadius;
    const y = p.height / 2 + Math.sin(this.angle) * this.orbitRadius;
    const pulse = Math.sin(this.pulsePhase) * this.pulseSize;
    const orbSize = this.baseSize + pulse;
    const d = p.dist(mx, my, x, y);

    const isHoveredNow = d < orbSize / 2;
    if (isHoveredNow && !this.hovered) {
      if (typeof showMemoryFocus === "function") {
        showMemoryFocus({
          text: this.originalText,
          caption: this.caption,
          emotion: this.emotion,
          timestamp: this.timestamp,
          color: this.color,
        });
      }
    } else if (!isHoveredNow && this.hovered) {
      if (typeof hideMemoryFocus === "function") hideMemoryFocus();
    }
    this.hovered = isHoveredNow;
    return this.hovered;
  }
}
