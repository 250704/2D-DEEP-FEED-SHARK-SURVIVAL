/**
 * SpriteAnimator - Sistem Animasi Sprite untuk Angry Sharks
 * Menangani loading, rendering, dan animasi sprite sheet
 */

class SpriteAnimator {
  constructor(canvasId, spriteConfig) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.spriteConfig = spriteConfig;

    this.frames = [];
    this.currentFrame = 0;
    this.isPlaying = false;
    this.frameIndex = 0;
    this.animationSpeed = spriteConfig.animationSpeed || 0.1;

    this.x = spriteConfig.startX || 50;
    this.y = spriteConfig.startY || 150;
    this.width = spriteConfig.width || 120;
    this.height = spriteConfig.height || 120;

    this.direction = spriteConfig.direction || 1; // 1 = kanan, -1 = kiri
    this.speed = spriteConfig.speed || 2;

    this.callbacks = {};

    this.loadFrames();
  }

  /**
   * Load semua frame gambar sprite
   */
  async loadFrames() {
    try {
      for (let i = 0; i < this.spriteConfig.frameCount; i++) {
        const framePath = this.spriteConfig.framePath(i + 1);
        const img = new Image();
        img.crossOrigin = "anonymous";

        await new Promise((resolve, reject) => {
          img.onload = () => {
            this.frames.push(img);
            resolve();
          };
          img.onerror = () => {
            console.warn(`Failed to load frame: ${framePath}`);
            resolve(); // Continue even if frame fails
          };
          img.src = framePath;
        });
      }

      console.log(`✅ Loaded ${this.frames.length} frames`);
      this.emit("framesLoaded");
    } catch (error) {
      console.error("Error loading frames:", error);
    }
  }

  /**
   * Mulai animasi
   */
  play() {
    this.isPlaying = true;
    this.frameIndex = 0;
    this.emit("animationStart");
    this.animate();
  }

  /**
   * Pause animasi
   */
  pause() {
    this.isPlaying = false;
    this.emit("animationPause");
  }

  /**
   * Stop dan reset animasi
   */
  stop() {
    this.isPlaying = false;
    this.frameIndex = 0;
    this.currentFrame = 0;
    this.emit("animationStop");
  }

  /**
   * Loop utama animasi
   */
  animate() {
    if (!this.isPlaying) return;

    // Update frame
    this.frameIndex += this.animationSpeed;

    if (this.frameIndex >= this.frames.length) {
      this.frameIndex = 0;
      this.emit("animationLoop");
    }

    this.currentFrame = Math.floor(this.frameIndex);

    // Update posisi
    this.x += this.speed * this.direction;

    // Bounce ketika mencapai tepi dengan margin untuk ruang kosong
    const margin = 60; // Ruang kosong di tepi agar target jelas
    if (this.x + this.width > this.canvas.width - margin || this.x < margin) {
      this.direction *= -1;
      this.emit("bounce");
    }

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw background
    this.drawBackground();

    // Draw sprite
    this.drawFrame();

    // Update UI
    this.updateUI();

    // Continue animation
    requestAnimationFrame(() => this.animate());
  }

  /**
   * Render frame saat ini
   */
  drawFrame() {
    if (this.frames.length === 0) return;

    const frame = this.frames[this.currentFrame];
    if (!frame) return;

    this.ctx.save();

    // Flip jika bergerak ke kiri
    if (this.direction === -1) {
      this.ctx.translate(this.x + this.width, this.y);
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(frame, 0, 0, this.width, this.height);
    } else {
      this.ctx.drawImage(frame, this.x, this.y, this.width, this.height);
    }

    this.ctx.restore();

    // Draw debug info
    if (this.spriteConfig.debug) {
      this.drawDebugInfo();
    }
  }

  /**
   * Draw background gradient
   */
  drawBackground() {
    // Gradient biru laut
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, "#1e90ff");
    gradient.addColorStop(0.5, "#0047ab");
    gradient.addColorStop(1, "#001a4d");

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw some bubbles
    this.drawBubbles();
  }

  /**
   * Draw bubble effects
   */
  drawBubbles() {
    const time = Date.now() / 1000;

    for (let i = 0; i < 5; i++) {
      const x = (i * 160 + time * 30) % this.canvas.width;
      const y = (i * 80 + Math.sin(time + i) * 20) % this.canvas.height;
      const radius = 3 + Math.sin(time + i * 0.5) * 2;

      this.ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  /**
   * Draw debug information
   */
  drawDebugInfo() {
    this.ctx.fillStyle = "#00ff00";
    this.ctx.font = "bold 12px Arial";
    this.ctx.fillText(
      `Frame: ${this.currentFrame + 1}/${this.frames.length}`,
      10,
      20,
    );
    this.ctx.fillText(`X: ${Math.round(this.x)}`, 10, 35);
    this.ctx.fillText(`Dir: ${this.direction > 0 ? "→" : "←"}`, 10, 50);
  }

  /**
   * Update UI elements
   */
  updateUI() {
    // Update frame counter
    const frameCountEl = document.getElementById("frameCount");
    if (frameCountEl) {
      frameCountEl.textContent = this.currentFrame + 1;
    }

    // Update position
    const positionEl = document.getElementById("position");
    if (positionEl) {
      positionEl.textContent = Math.round(this.x);
    }

    // Update status
    const statusEl = document.getElementById("status");
    if (statusEl) {
      statusEl.textContent = this.isPlaying ? "Playing ▶" : "Stopped ⏹";
    }
  }

  /**
   * Event emitter
   */
  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  emit(event, data = null) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach((callback) => callback(data));
    }
  }

  /**
   * Set kecepatan animasi
   */
  setAnimationSpeed(speed) {
    this.animationSpeed = speed;
  }

  /**
   * Set kecepatan gerakan
   */
  setMovementSpeed(speed) {
    this.speed = speed;
  }

  /**
   * Change direction
   */
  setDirection(direction) {
    this.direction = direction;
  }
}

// Export untuk Node.js
if (typeof module !== "undefined" && module.exports) {
  module.exports = SpriteAnimator;
}
