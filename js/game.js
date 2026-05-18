/**
 * Game Controller untuk Angry Sharks
 * Mengelola sprite animator dan game logic
 */

class Game {
  constructor() {
    this.animator = null;
    this.initGame();
  }

  /**
   * Initialize game
   */
  initGame() {
    // Konfigurasi sprite untuk shark berjalan
    const spriteConfig = {
      frameCount: 4,
      framePath: (frameNum) => `assets/sprites/shark-walk-${frameNum}.jpeg`,
      animationSpeed: 0.1,
      startX: 50,
      startY: 150,
      width: 150,
      height: 150,
      direction: 1,
      speed: 3,
      debug: false,
    };

    // Create animator
    this.animator = new SpriteAnimator("gameCanvas", spriteConfig);

    // Bind controls
    this.setupControls();

    // Log
    console.log("🎮 Game initialized");
  }

  /**
   * Setup control buttons
   */
  setupControls() {
    // Keyboard controls
    document.addEventListener("keydown", (e) => {
      switch (e.key.toLowerCase()) {
        case " ":
          this.startAnimation();
          break;
        case "p":
          this.togglePause();
          break;
        case "r":
          this.resetAnimation();
          break;
        case "arrowleft":
          this.animator.setDirection(-1);
          break;
        case "arrowright":
          this.animator.setDirection(1);
          break;
      }
    });
  }

  /**
   * Start animation
   */
  startAnimation() {
    this.animator.play();
    console.log("▶ Animation started");
  }

  /**
   * Stop animation
   */
  stopAnimation() {
    this.animator.pause();
    console.log("⏸ Animation paused");
  }

  /**
   * Toggle pause
   */
  togglePause() {
    if (this.animator.isPlaying) {
      this.stopAnimation();
    } else {
      this.startAnimation();
    }
  }

  /**
   * Reset animation
   */
  resetAnimation() {
    this.animator.stop();
    console.log("↻ Animation reset");
  }

  /**
   * Set animation speed (0.05 - 0.5)
   */
  setAnimationSpeed(speed) {
    this.animator.setAnimationSpeed(Math.max(0.05, Math.min(0.5, speed)));
  }

  /**
   * Set movement speed (1 - 10)
   */
  setMovementSpeed(speed) {
    this.animator.setMovementSpeed(Math.max(1, Math.min(10, speed)));
  }
}

// Initialize game when DOM is ready
let game;

document.addEventListener("DOMContentLoaded", () => {
  game = new Game();

  // Add slider controls if they exist
  const speedSlider = document.getElementById("speedSlider");
  const moveSlider = document.getElementById("moveSlider");

  if (speedSlider) {
    speedSlider.addEventListener("input", (e) => {
      game.setAnimationSpeed(parseFloat(e.target.value));
    });
  }

  if (moveSlider) {
    moveSlider.addEventListener("input", (e) => {
      game.setMovementSpeed(parseFloat(e.target.value));
    });
  }

  console.log("📍 Game loaded. Use Space to play, P to pause, R to reset");
  console.log("⌨️  Arrow keys to change direction");
});

// Export untuk module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = Game;
}
