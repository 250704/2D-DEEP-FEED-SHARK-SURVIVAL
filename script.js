"use strict";
// ═══════════════════════════════════════════════════════
//  DEEPFEED — Shark Survival  |  script.js
// ═══════════════════════════════════════════════════════

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ── DOM refs ──
const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const comboEl = document.getElementById("combo");
const eatenEl = document.getElementById("eaten");
const healthBar = document.getElementById("health-bar");
const startScr = document.getElementById("start-screen");
const goScr = document.getElementById("gameover-screen");
const pauseScr = document.getElementById("pause-screen");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const resumeBtn = document.getElementById("resume-btn");
const goScore = document.getElementById("go-score");
const goHighScore = document.getElementById("go-high-score");
const goEaten = document.getElementById("go-eaten");
const goDepth = document.getElementById("go-depth");
const goCombo = document.getElementById("go-combo");
const highScoreDisplay = document.getElementById("high-score-display");
const missionTextEl = document.getElementById("mission-text");
const tutorialTipEl = document.getElementById("tutorial-tip");
const dangerWarningEl = document.getElementById("danger-warning");

// ── Constants ──
const TAU = Math.PI * 2;
const PLAYER_BASE_RADIUS = 28;
const MAX_HEALTH = 100;
const HEALTH_DRAIN = 3.5; // per second
const HEALTH_EAT = 18; // gained on eat
const MAX_SIZE_GROW = 3.2; // max size multiplier
const SPAWN_MARGIN = 80;
const COMBO_WINDOW = 3.5; // seconds before combo resets
const MAX_LEVEL = 8;
const HAZARD_BASE_INTERVAL = 3.4;
const EDIBLE_FISH_SPEED_BOOST = 1.28;
const FISH_SMOOTH_PROFILE = "arcade"; // "arcade" | "cinematic"
const FISH_SIZE_PROFILE = {
  nemo: { spawnRadius: [0.9, 1.04], draw: [0.96, 1.04] },
  realistic: { spawnRadius: [0.94, 1.08], draw: [1.0, 1.08] },
  yellow: { spawnRadius: [0.92, 1.06], draw: [0.98, 1.06] },
  barakuda: { spawnRadius: [0.98, 1.14], draw: [1.02, 1.12] },
  whaleSmall: { spawnRadius: [0.78, 0.98], draw: [1.0, 1.08] },
  whaleMedium: { spawnRadius: [1.08, 1.3], draw: [1.1, 1.2] },
  whaleLarge: { spawnRadius: [1.78, 2.18], draw: [1.24, 1.36] },
};

const SHARK_STAGES = [
  {
    name: "ANAK",
    sizeReq: 1.0,
    speedMul: 1.0,
    damageMul: 1.0,
    glow: "#63c8ff",
  },
  {
    name: "PEMBURU",
    sizeReq: 1.45,
    speedMul: 1.05,
    damageMul: 0.94,
    glow: "#69deff",
  },
  {
    name: "ALFA",
    sizeReq: 1.95,
    speedMul: 1.1,
    damageMul: 0.88,
    glow: "#7bf2ff",
  },
  {
    name: "MUTAN",
    sizeReq: 2.45,
    speedMul: 1.16,
    damageMul: 0.8,
    glow: "#8dffcc",
  },
  {
    name: "TITAN",
    sizeReq: 2.95,
    speedMul: 1.22,
    damageMul: 0.74,
    glow: "#ffe28a",
  },
];

// ── State ──
let W, H, DPR;
let state = "start"; // start | play | over | pause
let lastTime = 0;
let score = 0,
  eaten = 0,
  maxDepth = 1,
  bestCombo = 1;
let highScore = 0; // High score tracking
let comboCount = 0,
  comboTimer = 0;
let health = MAX_HEALTH;
let playerSize = 1;
let sizeTarget = 1;
let level = 1;
let spawnTimer = 0;
let spawnInterval = 2.2;
let hazardTimer = 0;
let shakeX = 0,
  shakeY = 0,
  shakeMag = 0;
let sharkStageIndex = 0;
let startGraceTimer = 0;
let dangerWarningTimer = 0;
let tutorialTimer = 0;
let currentTutorialStep = -1;
let missionIndex = 0;
let missionProgress = 0;

const MISSIONS = [
  { id: "eat_small", label: "Makan 6 ikan kecil", target: 6, reward: 80 },
  { id: "survive", label: "Bertahan 45 detik", target: 45, reward: 120 },
  { id: "combo", label: "Capai kombo x5", target: 5, reward: 150 },
  { id: "grow", label: "Capai ukuran 2.6x", target: 2.6, reward: 220 },
];

const TUTORIAL_STEPS = [
  { time: 0, text: "Gerakkan hiu ke ikan kecil untuk makan dan tumbuh." },
  {
    time: 6,
    text: "Jaga vitalitas tetap aman. Jangan terlalu lama tanpa makan.",
  },
  {
    time: 12,
    text: "Ikan besar dan hazard bisa melukai. Putar arah sebelum tabrak.",
  },
  { time: 20, text: "Kejar kombo cepat untuk skor lebih tinggi." },
];

// ── Pools ──
let fishes = [];
let particles = [];
let bubbles = [];
let popTexts = [];
let hazards = []; // Bombs, mines, and other obstacles

// ── Mouse ──
const mouse = { x: 0, y: 0, wx: 0, wy: 0 };
const keys = { w: false, a: false, s: false, d: false };
const pressedMoveKeys = new Set();
const keyPressOrder = { w: 0, a: 0, s: 0, d: 0 };
let keyPressTick = 0;
let controlMode = "mouse"; // "mouse" | "keyboard"
const KEYBOARD_ONLY_MOVEMENT = true;
const camera = { x: 0, y: 0, zoom: 1, targetZoom: 1 };

function resetMovementInputs() {
  pressedMoveKeys.clear();
  keys.w = false;
  keys.a = false;
  keys.s = false;
  keys.d = false;
  keyPressOrder.w = 0;
  keyPressOrder.a = 0;
  keyPressOrder.s = 0;
  keyPressOrder.d = 0;
  keyPressTick = 0;
  controlMode = KEYBOARD_ONLY_MOVEMENT ? "keyboard" : "mouse";
}

function focusGameCanvas() {
  if (typeof canvas.focus === "function") {
    try {
      canvas.focus({ preventScroll: true });
    } catch {
      canvas.focus();
    }
  }
}

function screenToWorld(sx, sy) {
  return {
    x: (sx - W * 0.5) / camera.zoom + camera.x,
    y: (sy - H * 0.5) / camera.zoom + camera.y,
  };
}

function getViewInfo() {
  const zoom = Math.max(camera.zoom, 0.001);
  const viewW = W / zoom;
  const viewH = H / zoom;
  return {
    zoom,
    viewW,
    viewH,
    left: camera.x - viewW * 0.5,
    right: camera.x + viewW * 0.5,
    top: camera.y - viewH * 0.5,
    bottom: camera.y + viewH * 0.5,
    radius: Math.hypot(viewW, viewH) * 0.5,
  };
}

// ── Shark Animation Assets ──
let sharkFrames = [];
let sharkFrameIndex = 0;
let sharkFrameTimer = 0;
let nemoDirSprites = new Array(8).fill(null);
let realisticDirSprites = new Array(8).fill(null);
let yellowDirSprites = new Array(8).fill(null);
let barakudaDirSprites = new Array(8).fill(null);
let whaleDirSprites = new Array(8).fill(null);
const SHARK_IDLE_FPS = 4.5;
const SHARK_SWIM_FPS = 11.5;
// Directional sprite order:
// 0 right, 1 down-right, 2 down, 3 down-left, 4 left, 5 up-left, 6 up, 7 up-right
const SHARK_FRAME_CANDIDATES = [
  [
    "assets/aset-shack/right-removebg-preview.png",
    "asset/asset-shck/right-removebg-preview.png",
  ],
  [
    "assets/aset-shack/down-right-removebg-preview.png",
    "asset/asset-shck/down-right-removebg-preview.png",
  ],
  [
    "assets/aset-shack/down-removebg-preview.png",
    "asset/asset-shck/down-removebg-preview.png",
  ],
  [
    "assets/aset-shack/down-left-removebg-preview.png",
    "asset/asset-shck/down-left-removebg-preview.png",
  ],
  [
    "assets/aset-shack/left-removebg-preview.png",
    "asset/asset-shck/left-removebg-preview.png",
  ],
  [
    "assets/aset-shack/up-left-removebg-preview.png",
    "asset/asset-shck/up-left-removebg-preview.png",
  ],
  [
    "assets/aset-shack/up-removebg-preview.png",
    "asset/asset-shck/up-removebg-preview.png",
  ],
  [
    "assets/aset-shack/up-right-removebg-preview.png",
    "asset/asset-shck/up-right-removebg-preview.png",
  ],
];
const NEMO_DIR_CANDIDATES = [
  // 0 right, 1 down-right, 2 down, 3 down-left, 4 left, 5 up-left, 6 up, 7 up-right
  [
    "assets/nemo/ip-right-removebg-preview.png",
    "assets/nemo/right-removebg-preview.png",
  ],
  [
    "assets/nemo/down-right-removebg-preview.png",
    "assets/nemo/down-right-removebg-preview (1).png",
  ],
  ["assets/nemo/down-removebg-preview.png"],
  ["assets/nemo/down_left-removebg-preview.png"],
  ["assets/nemo/left-removebg-preview.png"],
  ["assets/nemo/uo-left-removebg-preview.png"],
  ["assets/nemo/up-removebg-preview.png"],
  [
    "assets/nemo/down-right-removebg-preview.png",
    "assets/nemo/down-right-removebg-preview (1).png",
  ],
];
const REALISTIC_DIR_CANDIDATES = [
  ["assets/fish/realistic/fish-right.png"],
  ["assets/fish/realistic/fish-down-right.png"],
  ["assets/fish/realistic/fish-down.png"],
  ["assets/fish/realistic/fish-down-left.png"],
  ["assets/fish/realistic/fish-left.png"],
  ["assets/fish/realistic/fish-up-left.png"],
  ["assets/fish/realistic/fish-up.png"],
  ["assets/fish/realistic/fish-up-right.png"],
];
const YELLOW_DIR_CANDIDATES = [
  ["assets/fish/yellow/fish-right.png"],
  ["assets/fish/yellow/fish-down-right.png"],
  ["assets/fish/yellow/fish-down.png"],
  ["assets/fish/yellow/fish-down-left.png"],
  ["assets/fish/yellow/fish-left.png"],
  ["assets/fish/yellow/fish-up-left.png"],
  ["assets/fish/yellow/fish-up.png"],
  ["assets/fish/yellow/fish-up-right.png"],
];
const BARAKUDA_DIR_CANDIDATES = [
  ["assets/fish/barakuda/fish-right.png"],
  ["assets/fish/barakuda/fish-down-right.png"],
  ["assets/fish/barakuda/fish-down.png"],
  ["assets/fish/barakuda/fish-down-left.png"],
  ["assets/fish/barakuda/fish-left.png"],
  ["assets/fish/barakuda/fish-up-left.png"],
  ["assets/fish/barakuda/fish-up.png"],
  ["assets/fish/barakuda/fish-up-right.png"],
];
const WHALE_DIR_CANDIDATES = [
  ["assets/fish/whale/fish-right.png"],
  ["assets/fish/whale/fish-down-right.png"],
  ["assets/fish/whale/fish-down.png"],
  ["assets/fish/whale/fish-down-left.png"],
  ["assets/fish/whale/fish-left.png"],
  ["assets/fish/whale/fish-up-left.png"],
  ["assets/fish/whale/fish-up.png"],
  ["assets/fish/whale/fish-up-right.png"],
];

function tryLoadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function removeSpriteBackground(sourceImg) {
  const w = sourceImg.naturalWidth || sourceImg.width;
  const h = sourceImg.naturalHeight || sourceImg.height;
  if (!w || !h) return sourceImg;

  const canvasEl = document.createElement("canvas");
  canvasEl.width = w;
  canvasEl.height = h;
  const c = canvasEl.getContext("2d", { willReadFrequently: true });
  c.drawImage(sourceImg, 0, 0, w, h);

  const imgData = c.getImageData(0, 0, w, h);
  const data = imgData.data;

  // If image already has transparency, keep as-is.
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) return sourceImg;
  }

  // Black background key for JPEG sprite sheets:
  // remove only near-black pixels so shark colors stay unchanged.
  const hardCut = 24;
  const softCut = 46;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (luminance <= hardCut) {
      data[i + 3] = 0;
    } else if (luminance < softCut) {
      const t = (luminance - hardCut) / (softCut - hardCut);
      data[i + 3] = Math.min(data[i + 3], Math.round(255 * t));
    }
  }

  c.putImageData(imgData, 0, 0);
  return canvasEl;
}

// Load shark walk animation frames from active sprite set
async function loadSharkFrames() {
  const loadedFrames = [];
  for (const candidates of SHARK_FRAME_CANDIDATES) {
    let frame = null;
    for (const src of candidates) {
      frame = await tryLoadImage(src);
      if (frame) break;
    }
    if (frame) loadedFrames.push(removeSpriteBackground(frame));
  }
  sharkFrames = loadedFrames;
  sharkFrameIndex = 0;
  sharkFrameTimer = 0;
  if (sharkFrames.length > 0) {
    console.log(`Loaded ${sharkFrames.length} shark frames`);
  } else {
    console.warn("No shark sprite frames found. Using fallback shape.");
  }
}
loadSharkFrames();

// Initialize high score from localStorage
function initHighScore() {
  const stored = localStorage.getItem("deepfeed_highscore");
  if (stored !== null) {
    highScore = parseInt(stored, 10) || 0;
  }
  updateHighScoreDisplay();
}

// Update high score display on start screen
function updateHighScoreDisplay() {
  if (highScoreDisplay) {
    highScoreDisplay.textContent = highScore.toString();
  }
}

// Check and update high score when game ends
function checkHighScore() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("deepfeed_highscore", highScore.toString());
    updateHighScoreDisplay();
  }
}

initHighScore();

// ── Web Audio: procedural SFX (no external files; unlocks on user tap) ──
let sfxCtx = null;
let sfxMaster = null;
let musicMaster = null;
/** @type {AudioScheduledSourceNode[]} */
let ambientStoppables = [];
let ambientDroneGains = [];
let musicNextNoteAt = 0;
let musicStepIndex = 0;
let fallbackMusicCooldown = 0;
let fallbackMusicStep = 0;
const MUSIC_FILE_PATH = "assets/sounds/beneath-the-coral-shelf_RwmZAy9S.mp3";
let bgmAudio = null;

const MUSIC_BPM = 102;
const MUSIC_STEP_BEATS = 0.5;
const MUSIC_LEAD_PATTERN = [
  220, 246.94, 261.63, 293.66, 329.63, 293.66, 261.63, 246.94,
];
const FALLBACK_MUSIC_PATTERN = [
  174.61, 196, 220, 246.94, 196, 220, 246.94, 293.66,
];

function sfxGetContext() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!sfxCtx) {
    sfxCtx = new AC();
    sfxMaster = sfxCtx.createGain();
    sfxMaster.gain.value = 0.95;
    sfxMaster.connect(sfxCtx.destination);
    musicMaster = sfxCtx.createGain();
    musicMaster.gain.value = 0;
    musicMaster.connect(sfxCtx.destination);
  }
  return sfxCtx;
}

function getBgmAudio() {
  if (bgmAudio) return bgmAudio;
  const audio = new Audio(MUSIC_FILE_PATH);
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = 0.5;
  bgmAudio = audio;
  return bgmAudio;
}

async function sfxUnlock() {
  const ctx = sfxGetContext();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") await ctx.resume();
    // Satu “blip” tak terdengar membantu beberapa browser/WebView membuka graf audio.
    if (sfxMaster) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      g.gain.value = 0.00001;
      osc.connect(g);
      g.connect(sfxMaster);
      const now = ctx.currentTime;
      osc.start(now);
      osc.stop(now + 0.001);
    }
  } catch (_) {}
}

function sfxNow() {
  const ctx = sfxGetContext();
  return ctx ? ctx.currentTime : 0;
}

function sfxTone(freq, dur, type, peakVol, t0, freqEnd) {
  const ctx = sfxGetContext();
  if (!ctx || !sfxMaster) return;
  const bgm = getBgmAudio();
  if (bgm && !bgm.paused) {
    const baseVol = 0.55;
    const duckVol = Math.max(0.28, baseVol - 0.12);
    bgm.volume = duckVol;
    setTimeout(() => {
      if (!bgm.paused) bgm.volume = baseVol;
    }, 140);
  }
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + dur);
  }
  osc.connect(g);
  g.connect(sfxMaster);
  const v = Math.max(0.0001, peakVol);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(v, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

function sfxNoiseBurst(dur, peakVol, t0, filterFreq) {
  const ctx = sfxGetContext();
  if (!ctx || !sfxMaster) return;
  const bgm = getBgmAudio();
  if (bgm && !bgm.paused) {
    const baseVol = 0.55;
    const duckVol = Math.max(0.26, baseVol - 0.16);
    bgm.volume = duckVol;
    setTimeout(() => {
      if (!bgm.paused) bgm.volume = baseVol;
    }, 180);
  }
  const len = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++)
    data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filt = ctx.createBiquadFilter();
  filt.type = "bandpass";
  filt.frequency.value = filterFreq;
  filt.Q.value = 0.85;
  const g = ctx.createGain();
  src.connect(filt);
  filt.connect(g);
  g.connect(sfxMaster);
  const v = Math.max(0.0001, peakVol);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(v, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

function playSfxEat(comboCount) {
  const t0 = sfxNow();
  const pitch = 1 + Math.min(comboCount, 8) * 0.045;
  sfxTone(420 * pitch, 0.07, "triangle", 0.22, t0, 140 * pitch);
  sfxTone(880 * pitch, 0.04, "sine", 0.08, t0 + 0.02);
}

function playSfxHurt() {
  const t0 = sfxNow();
  sfxNoiseBurst(0.14, 0.35, t0, 420);
  sfxTone(95, 0.18, "sawtooth", 0.12, t0, 55);
}

function playSfxHazard() {
  const t0 = sfxNow();
  sfxNoiseBurst(0.12, 0.32, t0, 1200);
  sfxTone(180, 0.1, "square", 0.08, t0 + 0.02, 60);
}

function playSfxLevelUp() {
  const t0 = sfxNow();
  sfxTone(523, 0.1, "sine", 0.18, t0);
  sfxTone(659, 0.1, "sine", 0.16, t0 + 0.08);
  sfxTone(784, 0.14, "sine", 0.2, t0 + 0.16);
}

function playSfxEvolve() {
  const t0 = sfxNow();
  sfxTone(392, 0.12, "sine", 0.15, t0);
  sfxTone(494, 0.12, "sine", 0.15, t0 + 0.1);
  sfxTone(587, 0.12, "sine", 0.15, t0 + 0.2);
  sfxTone(784, 0.2, "triangle", 0.22, t0 + 0.32);
}

function playSfxGameOver() {
  const t0 = sfxNow();
  sfxTone(220, 0.2, "sine", 0.2, t0, 110);
  sfxTone(165, 0.35, "sine", 0.18, t0 + 0.18, 55);
}

function playSfxMission() {
  const t0 = sfxNow();
  sfxTone(660, 0.08, "sine", 0.14, t0);
  sfxTone(880, 0.1, "sine", 0.16, t0 + 0.07);
  sfxTone(1320, 0.14, "triangle", 0.12, t0 + 0.14);
}

function playSfxGold() {
  const t0 = sfxNow();
  sfxTone(1200, 0.06, "sine", 0.12, t0);
  sfxTone(1800, 0.08, "sine", 0.14, t0 + 0.05);
}

function playSfxHeart() {
  const t0 = sfxNow();
  sfxTone(392, 0.12, "sine", 0.14, t0);
  sfxTone(494, 0.15, "sine", 0.12, t0 + 0.1);
}

// ── Ambient BGM (procedural “deep ocean” pad, same AudioContext as SFX) ──
function stopAmbientMusic() {
  const audio = getBgmAudio();
  try {
    audio.pause();
    audio.currentTime = 0;
  } catch (_) {}

  const ctx = sfxGetContext();
  const t = ctx ? ctx.currentTime : 0;
  for (const n of ambientStoppables) {
    try {
      n.stop(t + 0.04);
    } catch (_) {}
  }
  ambientStoppables.length = 0;
  ambientDroneGains = [];
  musicNextNoteAt = 0;
  musicStepIndex = 0;
  fallbackMusicCooldown = 0;
  fallbackMusicStep = 0;
  if (musicMaster && ctx) {
    musicMaster.gain.cancelScheduledValues(t);
    musicMaster.gain.linearRampToValueAtTime(0, t + 0.35);
  }
}

function scheduleMusicLeadNote(ctx, t0, hz, intensity) {
  if (!musicMaster) return;
  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(hz, t0);
  const g = ctx.createGain();
  const peak = 0.075 + intensity * 0.04;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.24);
  osc.connect(g);
  g.connect(musicMaster);
  osc.start(t0);
  osc.stop(t0 + 0.27);
}

function startAmbientMusic() {
  const audio = getBgmAudio();
  let fileMusicActive = false;
  try {
    audio.volume = 0.55;
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
    fileMusicActive = true;
  } catch (_) {}
  if (fileMusicActive) return;

  const ctx = sfxGetContext();
  if (!ctx || !musicMaster) return;
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  stopAmbientMusic();

  const t0 = ctx.currentTime;
  musicMaster.gain.cancelScheduledValues(t0);
  musicMaster.gain.setValueAtTime(0, t0);
  musicMaster.gain.linearRampToValueAtTime(0.55, t0 + 0.9);
  musicNextNoteAt = t0 + 0.15;
  musicStepIndex = 0;
  fallbackMusicCooldown = 0.06;
  fallbackMusicStep = 0;

  const drones = [
    [110, 0.11],
    [164.81, 0.085],
    [220, 0.065],
  ];
  for (const [hz, vol] of drones) {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = hz;
    const g = ctx.createGain();
    g.gain.value = vol;
    o.connect(g);
    g.connect(musicMaster);
    o.start(t0);
    ambientStoppables.push(o);
    ambientDroneGains.push(g);
  }

  // Soft startup cue so user can clearly hear that music has started.
  const intro = ctx.createOscillator();
  intro.type = "sine";
  intro.frequency.setValueAtTime(294, t0);
  intro.frequency.exponentialRampToValueAtTime(220, t0 + 0.55);
  const introGain = ctx.createGain();
  introGain.gain.setValueAtTime(0.0001, t0);
  introGain.gain.exponentialRampToValueAtTime(0.05, t0 + 0.05);
  introGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6);
  intro.connect(introGain);
  introGain.connect(musicMaster);
  intro.start(t0);
  intro.stop(t0 + 0.65);
}

function updateFallbackMusic(dt, intensity) {
  if (state !== "play") return;
  fallbackMusicCooldown -= dt;
  const stepDur = 0.3;
  while (fallbackMusicCooldown <= 0) {
    const hz =
      FALLBACK_MUSIC_PATTERN[fallbackMusicStep % FALLBACK_MUSIC_PATTERN.length];
    const t0 = sfxNow() + 0.02;
    const leadVol = 0.1 + intensity * 0.05;
    const bassVol = 0.07 + intensity * 0.03;
    sfxTone(hz, 0.2, "triangle", leadVol, t0, hz * 0.998);
    if (fallbackMusicStep % 2 === 0) {
      sfxTone(Math.max(55, hz * 0.5), 0.26, "sine", bassVol, t0);
    }
    fallbackMusicStep++;
    fallbackMusicCooldown += stepDur;
  }
}

function updateAmbientMusic() {
  const audio = getBgmAudio();
  if (state === "play") {
    const p = audio.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
    if (!audio.paused) return;
  }

  if (!sfxCtx || !musicMaster) return;
  if (state !== "play") return;
  const t = sfxCtx.currentTime;
  const levelNorm = clamp((level - 1) / Math.max(1, MAX_LEVEL - 1), 0, 1);
  const lowHealthNorm = clamp((MAX_HEALTH - health) / MAX_HEALTH, 0, 1);
  const dangerNorm = clamp(hazards.length / 8, 0, 1);
  const intensity = clamp(
    levelNorm * 0.55 + lowHealthNorm * 0.3 + dangerNorm * 0.25,
    0,
    1,
  );

  const targetMaster = 0.58 + intensity * 0.28;
  musicMaster.gain.cancelScheduledValues(t);
  musicMaster.gain.setTargetAtTime(targetMaster, t, 0.35);

  for (let i = 0; i < ambientDroneGains.length; i++) {
    const g = ambientDroneGains[i];
    const base = [0.11, 0.085, 0.065][i] ?? 0.06;
    g.gain.setTargetAtTime(base + intensity * 0.04, t, 0.5);
  }

  // Continuous musical loop (lead notes) while game is running.
  const stepDur = (60 / MUSIC_BPM) * MUSIC_STEP_BEATS;
  const lookAhead = 0.25;
  if (musicNextNoteAt <= 0) musicNextNoteAt = t + 0.05;
  while (musicNextNoteAt < t + lookAhead) {
    const note = MUSIC_LEAD_PATTERN[musicStepIndex % MUSIC_LEAD_PATTERN.length];
    scheduleMusicLeadNote(sfxCtx, musicNextNoteAt, note, intensity);
    musicNextNoteAt += stepDur;
    musicStepIndex++;
  }

  // Backup loop via SFX bus (audible on devices where ambient layer is too subtle).
  updateFallbackMusic(dtCache || 0.016, intensity);
}

async function loadDirectionalSprites(candidates, targetSprites, label) {
  let loaded = 0;
  for (let i = 0; i < candidates.length; i++) {
    for (const src of candidates[i]) {
      const img = await tryLoadImage(src);
      if (img) {
        targetSprites[i] = removeSpriteBackground(img);
        loaded++;
        break;
      }
    }
  }
  if (loaded > 0) {
    for (let i = 0; i < targetSprites.length; i++) {
      if (!targetSprites[i])
        targetSprites[i] = targetSprites[0] || targetSprites[1] || null;
    }
    console.log(`Loaded ${label} directional sprites: ${loaded}/8`);
  } else {
    console.warn(`No ${label} fish sprite found. Using default fish shape.`);
  }
}
loadDirectionalSprites(NEMO_DIR_CANDIDATES, nemoDirSprites, "Nemo");
loadDirectionalSprites(
  REALISTIC_DIR_CANDIDATES,
  realisticDirSprites,
  "Realistic",
);
loadDirectionalSprites(YELLOW_DIR_CANDIDATES, yellowDirSprites, "Yellow");
loadDirectionalSprites(BARAKUDA_DIR_CANDIDATES, barakudaDirSprites, "Barakuda");
loadDirectionalSprites(WHALE_DIR_CANDIDATES, whaleDirSprites, "Whale");

// ── Player ──
const player = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  angle: 0,
  targetAngle: 0,
  radius: PLAYER_BASE_RADIUS,
  scaleAnim: 1,
  eatAnim: 0,
  trail: [],
  invincible: 0,
  swimPhase: 0,
  bobOffset: 0,
  tilt: 0,
  spriteStretch: 1,
  speedNorm: 0,
  visualAngle: 0,
  spriteDirIndex: 0,
  spriteSwitchCooldown: 0,
};

// ═══════════════════════════════════════════════════════
//  RESIZE
// ═══════════════════════════════════════════════════════
function resize() {
  DPR = window.devicePixelRatio || 1;
  W = canvas.clientWidth || window.innerWidth;
  H = canvas.clientHeight || window.innerHeight;
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  mouse.wx = W / 2;
  mouse.wy = H / 2;
}
window.addEventListener("resize", resize);
resize();

// ═══════════════════════════════════════════════════════
//  INPUT
// ═══════════════════════════════════════════════════════
canvas.addEventListener("mousemove", (e) => {
  const r = canvas.getBoundingClientRect();
  mouse.wx = e.clientX - r.left;
  mouse.wy = e.clientY - r.top;
});
canvas.addEventListener("mousedown", () => {
  if (!KEYBOARD_ONLY_MOVEMENT) controlMode = "mouse";
  focusGameCanvas();
});
canvas.addEventListener(
  "touchstart",
  (e) => {
    e.preventDefault();
    if (!KEYBOARD_ONLY_MOVEMENT) controlMode = "mouse";
    focusGameCanvas();
    const r = canvas.getBoundingClientRect();
    const t = e.touches[0];
    if (!t) return;
    mouse.wx = t.clientX - r.left;
    mouse.wy = t.clientY - r.top;
  },
  { passive: false },
);
canvas.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    const t = e.touches[0];
    if (!t) return;
    mouse.wx = t.clientX - r.left;
    mouse.wy = t.clientY - r.top;
  },
  { passive: false },
);

function handleGlobalKeydown(e) {
  if (
    !e.repeat &&
    (e.code === "Escape" || e.code === "KeyP" || e.key === "p" || e.key === "P")
  ) {
    void togglePause();
  }
  setMoveKeyState(e, true);
}

function handleGlobalKeyup(e) {
  setMoveKeyState(e, false);
}

window.addEventListener("keydown", handleGlobalKeydown);
window.addEventListener("keyup", handleGlobalKeyup);
window.addEventListener("blur", resetMovementInputs);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) resetMovementInputs();
  else void sfxUnlock();
});

function getMoveKeyId(e) {
  const code = e.code || "";
  const key = (e.key || "").toLowerCase();
  if (code === "KeyW" || key === "w" || code === "ArrowUp" || key === "arrowup")
    return "w";
  if (
    code === "KeyA" ||
    key === "a" ||
    code === "ArrowLeft" ||
    key === "arrowleft"
  )
    return "a";
  if (
    code === "KeyS" ||
    key === "s" ||
    code === "ArrowDown" ||
    key === "arrowdown"
  )
    return "s";
  if (
    code === "KeyD" ||
    key === "d" ||
    code === "ArrowRight" ||
    key === "arrowright"
  )
    return "d";
  return null;
}

function setMoveKeyState(e, pressed) {
  const moveKey = getMoveKeyId(e);
  if (!moveKey) return;

  if (pressed) {
    controlMode = "keyboard";
    pressedMoveKeys.add(moveKey);
    keyPressTick += 1;
    keyPressOrder[moveKey] = keyPressTick;
  } else {
    pressedMoveKeys.delete(moveKey);
    keyPressOrder[moveKey] = 0;
  }

  keys.w = pressedMoveKeys.has("w");
  keys.a = pressedMoveKeys.has("a");
  keys.s = pressedMoveKeys.has("s");
  keys.d = pressedMoveKeys.has("d");
  e.preventDefault();
}

async function beginDeepFeedSession() {
  await sfxUnlock();
  startAmbientMusic();
  startGame();
}

startBtn.addEventListener("click", () => void beginDeepFeedSession());
restartBtn.addEventListener("click", () => void beginDeepFeedSession());
resumeBtn.addEventListener("click", () => void togglePause());

// ═══════════════════════════════════════════════════════
//  FISH CONFIG
// ═══════════════════════════════════════════════════════
const FISH_TYPES = [
  {
    tier: "tiny",
    minR: 7,
    maxR: 13,
    baseSpeed: 60,
    color1: "#ff9f43",
    color2: "#ffd32a",
    finColor: "#ff6b6b",
    points: 5,
    health: 0,
    weight: 9,
  },
  {
    tier: "small",
    minR: 14,
    maxR: 20,
    baseSpeed: 70,
    color1: "#48dbfb",
    color2: "#0abde3",
    finColor: "#006ba6",
    points: 10,
    health: 0,
    weight: 8,
  },
  {
    tier: "medium",
    minR: 24,
    maxR: 34,
    baseSpeed: 80,
    color1: "#1dd1a1",
    color2: "#10ac84",
    finColor: "#006c5f",
    points: 20,
    health: 0,
    weight: 5,
  },
  {
    tier: "large",
    minR: 40,
    maxR: 55,
    baseSpeed: 95,
    color1: "#ee5a24",
    color2: "#b71540",
    finColor: "#6f0000",
    points: 0,
    health: -30,
    weight: 5,
  },
  {
    tier: "boss",
    minR: 60,
    maxR: 80,
    baseSpeed: 75,
    color1: "#6c5ce7",
    color2: "#341f97",
    finColor: "#1a0080",
    points: 0,
    health: -50,
    weight: 2,
  },
];

// ═══════════════════════════════════════════════════════
//  GAME INIT / START / OVER
// ═══════════════════════════════════════════════════════
function startGame() {
  focusGameCanvas();
  startAmbientMusic();
  if (KEYBOARD_ONLY_MOVEMENT) controlMode = "keyboard";
  score = 0;
  eaten = 0;
  level = 1;
  maxDepth = 1;
  bestCombo = 1;
  comboCount = 0;
  comboTimer = 0;
  health = MAX_HEALTH;
  playerSize = 1;
  sizeTarget = 1;
  spawnInterval = 2.2;
  spawnTimer = 0;
  hazardTimer = 0;
  shakeMag = 0;
  shakeX = 0;
  shakeY = 0;
  sharkStageIndex = 0;
  startGraceTimer = 2.0;
  dangerWarningTimer = 0;
  tutorialTimer = 0;
  currentTutorialStep = -1;
  missionIndex = 0;
  missionProgress = 0;
  fishes = [];
  particles = [];
  bubbles = [];
  popTexts = [];
  hazards = [];

  player.x = W / 2;
  player.y = H / 2;
  player.vx = 0;
  player.vy = 0;
  player.angle = 0;
  player.targetAngle = 0;
  player.radius = PLAYER_BASE_RADIUS;
  player.scaleAnim = 1;
  player.eatAnim = 0;
  player.trail = [];
  player.invincible = 0;
  player.swimPhase = 0;
  player.bobOffset = 0;
  player.tilt = 0;
  player.spriteStretch = 1;
  player.speedNorm = 0;
  player.visualAngle = 0;
  player.spriteDirIndex = 0;
  player.spriteSwitchCooldown = 0;
  keys.w = false;
  keys.a = false;
  keys.s = false;
  keys.d = false;

  camera.x = player.x;
  camera.y = player.y;
  camera.zoom = 1;
  camera.targetZoom = 1;

  sharkFrameIndex = 0;
  sharkFrameTimer = 0;

  mouse.wx = W / 2;
  mouse.wy = H / 2;

  // spawn initial bubbles
  for (let i = 0; i < 30; i++) spawnBubble(true);

  // spawn initial fish crowd (some visible immediately for better onboarding)
  for (let i = 0; i < 12; i++) spawnFish(true);
  for (let i = 0; i < 10; i++) spawnFish(false);

  showScreen(null);
  state = "play";
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function gameOver() {
  stopAmbientMusic();
  state = "over";
  playSfxGameOver();
  setTutorialTip("");
  setDangerWarning(false);
  checkHighScore(); // Update high score if current score is higher
  goScore.textContent = score;
  if (goHighScore) goHighScore.textContent = highScore;
  goEaten.textContent = eaten;
  goDepth.textContent = maxDepth;
  goCombo.textContent = "x" + bestCombo;
  // big shake
  triggerShake(18);
  showScreen(goScr);
}

async function togglePause() {
  if (state === "play") {
    state = "pause";
    stopAmbientMusic();
    setTutorialTip("");
    setDangerWarning(false);
    showScreen(pauseScr);
  } else if (state === "pause") {
    await sfxUnlock();
    startAmbientMusic();
    state = "play";
    lastTime = performance.now();
    showScreen(null);
    requestAnimationFrame(loop);
  }
}

function showScreen(el) {
  [startScr, goScr, pauseScr].forEach((s) => {
    s.classList.toggle("active", s === el);
  });
  if (el) {
    setTutorialTip("");
    setDangerWarning(false);
  }
}

function setTutorialTip(text = "") {
  if (!tutorialTipEl) return;
  tutorialTipEl.textContent = text;
  tutorialTipEl.classList.toggle("hidden", !text);
}

function setDangerWarning(show) {
  if (!dangerWarningEl) return;
  dangerWarningEl.classList.toggle("hidden", !show);
}

function getMissionProgressText(mission) {
  if (mission.id === "grow")
    return `${mission.label} (${playerSize.toFixed(2)}/${mission.target})`;
  return `${mission.label} (${Math.floor(missionProgress)}/${mission.target})`;
}

function updateMissionProgress() {
  const mission = MISSIONS[missionIndex];
  if (!mission) return;
  if (mission.id === "survive") missionProgress += dtCache;
  if (mission.id === "combo")
    missionProgress = Math.max(missionProgress, comboCount);
  if (mission.id === "grow")
    missionProgress = Math.max(missionProgress, playerSize);

  const done = missionProgress >= mission.target;
  if (done) {
    playSfxMission();
    score += mission.reward;
    addPopText(
      player.x,
      player.y - player.radius - 28,
      `MISI SELESAI +${mission.reward}`,
      "#7efcff",
    );
    missionIndex = (missionIndex + 1) % MISSIONS.length;
    missionProgress = 0;
  }
}

let dtCache = 0;

function getFishTurnSmoothConfig() {
  if (FISH_SMOOTH_PROFILE === "cinematic") {
    return { turnMul: 0.82, bankMul: 1.15, bankClamp: 0.36, bankCatchup: 6.2 };
  }
  return { turnMul: 1.16, bankMul: 0.86, bankClamp: 0.24, bankCatchup: 8.8 };
}

function randFromRangePair(pair) {
  return randRange(pair[0], pair[1]);
}

// ═══════════════════════════════════════════════════════
//  SPAWN
// ═══════════════════════════════════════════════════════
function weightedTier() {
  const types = FISH_TYPES.filter((t) => {
    // Nonaktifkan ikan bentuk lama yang diminta dihapus:
    // - medium (hijau)
    // - large (oranye bergigi)
    if (t.tier === "medium" || t.tier === "large") return false;
    // Nonaktifkan boss default (ungu). Boss hanya muncul sebagai paus saat player sudah besar.
    if (t.tier === "boss" && playerSize < 2.25) return false;
    if (level < 2 && (t.tier === "large" || t.tier === "boss")) return false;
    if (level < 4 && t.tier === "boss") return false;
    return true;
  });
  const totalW = types.reduce((s, t) => s + t.weight, 0);
  let r = Math.random() * totalW;
  for (const t of types) {
    r -= t.weight;
    if (r <= 0) return t;
  }
  return types[0];
}

function getScaledFishRadius(type) {
  const baseRadius = lerp(type.minR, type.maxR, Math.random());
  const growthT = clamp((playerSize - 1) / (MAX_SIZE_GROW - 1), 0, 1);
  const tierScaleMap = {
    tiny: lerp(1.0, 1.28, growthT),
    small: lerp(1.0, 1.36, growthT),
    medium: lerp(1.0, 1.52, growthT),
    large: lerp(1.0, 1.72, growthT),
    boss: lerp(1.0, 1.92, growthT),
  };
  const scaled = baseRadius * (tierScaleMap[type.tier] || 1);
  return clamp(scaled, type.minR * 0.9, type.maxR * 2.25);
}

function spawnFish(canSpawnNearPlayer = false) {
  const type = weightedTier();
  let radius = getScaledFishRadius(type);
  const whaleUnlocked = playerSize >= 2.25;
  const isWhaleBoss = type.tier === "boss" && whaleUnlocked;
  let whaleClass = null;

  const view = getViewInfo();
  const spawnAngle = Math.random() * TAU;
  const spawnDist =
    canSpawnNearPlayer ?
      randRange(
        Math.max(90, player.radius * 3.2),
        Math.max(180, view.radius * 0.72),
      )
    : view.radius + randRange(120, 520);
  const x = player.x + Math.cos(spawnAngle) * spawnDist;
  const y = player.y + Math.sin(spawnAngle) * spawnDist;

  const angle = Math.atan2(player.y - y, player.x - x) + randRange(-0.9, 0.9);
  const canUseSpriteFish = type.tier === "tiny" || type.tier === "small";
  const edibleSpeedMul = canUseSpriteFish ? EDIBLE_FISH_SPEED_BOOST : 1;
  let whaleSpeedMul = 1;
  const speed =
    (type.baseSpeed + level * 4) * edibleSpeedMul * randRange(0.78, 1.34);

  // Keep ecosystem dynamic: some fish stay edible, some stay threatening.
  const roleRoll = Math.random();
  if (roleRoll < 0.2) {
    const preyMax = Math.max(type.minR, player.radius * randRange(0.5, 0.88));
    radius = Math.min(radius, preyMax);
  } else if (roleRoll > 0.82) {
    const predatorMin = Math.max(
      type.minR,
      player.radius * randRange(1.08, 1.36),
    );
    radius = Math.max(radius, predatorMin);
  }
  radius = clamp(radius, type.minR * 0.9, type.maxR * 2.4);
  if (isWhaleBoss) {
    const roll = Math.random();
    // Variasi paus: tidak semua raksasa, agar ada yang bisa dimakan.
    if (roll < 0.34) {
      whaleClass = "small";
      radius *= randFromRangePair(FISH_SIZE_PROFILE.whaleSmall.spawnRadius);
      radius = Math.min(radius, player.radius * randRange(0.72, 0.92));
      whaleSpeedMul = 1.04;
    } else if (roll < 0.74) {
      whaleClass = "medium";
      radius *= randFromRangePair(FISH_SIZE_PROFILE.whaleMedium.spawnRadius);
      radius = clamp(radius, player.radius * 0.9, player.radius * 1.16);
      whaleSpeedMul = 0.98;
    } else {
      whaleClass = "large";
      radius *= randFromRangePair(FISH_SIZE_PROFILE.whaleLarge.spawnRadius);
      radius = Math.max(radius, player.radius * randRange(1.32, 1.56));
      whaleSpeedMul = 0.9;
    }
  }

  let bonusType = null;
  if ((type.tier === "tiny" || type.tier === "small") && Math.random() < 0.08) {
    bonusType = Math.random() < 0.65 ? "heart" : "gold";
  }
  let fishSpriteType = null;
  if (canUseSpriteFish) {
    const roll = Math.random();
    if (roll < 0.25) fishSpriteType = "nemo";
    else if (roll < 0.5) fishSpriteType = "realistic";
    else if (roll < 0.75) fishSpriteType = "yellow";
    else fishSpriteType = "barakuda";
  } else if (isWhaleBoss) {
    fishSpriteType = "whale";
  }
  if (fishSpriteType === "nemo") {
    radius *= randFromRangePair(FISH_SIZE_PROFILE.nemo.spawnRadius);
  } else if (fishSpriteType === "realistic") {
    radius *= randFromRangePair(FISH_SIZE_PROFILE.realistic.spawnRadius);
  } else if (fishSpriteType === "yellow") {
    radius *= randFromRangePair(FISH_SIZE_PROFILE.yellow.spawnRadius);
  } else if (fishSpriteType === "barakuda") {
    radius *= randFromRangePair(FISH_SIZE_PROFILE.barakuda.spawnRadius);
  }

  fishes.push({
    x,
    y,
    radius,
    vx: Math.cos(angle) * speed * whaleSpeedMul,
    vy: Math.sin(angle) * speed * whaleSpeedMul,
    angle,
    type,
    wobble: Math.random() * TAU,
    wobbleSpeed: isWhaleBoss ? randRange(1.1, 2.1) : randRange(2, 5),
    turnTimer: isWhaleBoss ? randRange(1.8, 4.2) : randRange(1, 4),
    burstTimer: isWhaleBoss ? randRange(1.4, 3.1) : randRange(0.8, 2.6),
    aggression:
      type.tier === "boss" ? randRange(1.18, 1.45)
      : type.tier === "large" ? randRange(1.02, 1.28)
      : type.tier === "medium" ? randRange(0.86, 1.1)
      : randRange(0.66, 0.95),
    preferredDist:
      type.tier === "boss" ? randRange(140, 240)
      : type.tier === "large" ? randRange(170, 290)
      : type.tier === "medium" ? randRange(160, 320)
      : randRange(180, 340),
    wanderBias: randRange(-1, 1),
    fleeing: false,
    opacity: 0,
    scale: 0.1,
    alive: true,
    bonusType,
    fishSpriteType,
    visualAngle: angle,
    nemoDirIndex: getDirectionFrameIndex(angle),
    nemoDirCooldown: 0,
    swimPhase: Math.random() * TAU,
    swimFreq: isWhaleBoss ? randRange(3.2, 4.6) : randRange(8.5, 12.5),
    swimAmp: isWhaleBoss ? randRange(0.025, 0.05) : randRange(0.05, 0.1),
    turnResponsiveness:
      isWhaleBoss ? randRange(6.6, 8.2)
      : fishSpriteType ? randRange(10.5, 14.5)
      : randRange(8, 11),
    isWhaleBoss,
    whaleClass,
    bankAngle: 0,
    drawScaleMul:
      fishSpriteType === "nemo" ? randFromRangePair(FISH_SIZE_PROFILE.nemo.draw)
      : fishSpriteType === "realistic" ?
        randFromRangePair(FISH_SIZE_PROFILE.realistic.draw)
      : fishSpriteType === "yellow" ?
        randFromRangePair(FISH_SIZE_PROFILE.yellow.draw)
      : fishSpriteType === "barakuda" ?
        randFromRangePair(FISH_SIZE_PROFILE.barakuda.draw)
      : isWhaleBoss && whaleClass === "small" ?
        randFromRangePair(FISH_SIZE_PROFILE.whaleSmall.draw)
      : isWhaleBoss && whaleClass === "medium" ?
        randFromRangePair(FISH_SIZE_PROFILE.whaleMedium.draw)
      : isWhaleBoss ? randFromRangePair(FISH_SIZE_PROFILE.whaleLarge.draw)
      : 1,
  });
}

function spawnBubble(instant = false) {
  const view = getViewInfo();
  bubbles.push({
    x: randRange(view.left - 40, view.right + 40),
    y: instant ? randRange(view.top - 20, view.bottom + 20) : view.bottom + 20,
    r: randRange(2, 8),
    speed: randRange(25, 70),
    drift: randRange(-15, 15),
    opacity: randRange(0.15, 0.45),
    wobble: Math.random() * TAU,
  });
}

// ── Spawn Hazards (barrel / mine / harpoon) ──
function spawnHazard() {
  const view = getViewInfo();
  const typeRoll = Math.random();

  if (typeRoll < 0.36) {
    // toxic barrel dropping from top
    const x = randRange(view.left + 60, view.right - 60);
    hazards.push({
      x,
      y: view.top - 35,
      radius: 14,
      vx: randRange(-55, 55),
      vy: randRange(95, 170),
      type: "barrel",
      angle: Math.random() * TAU,
      angularVel: randRange(-2.4, 2.4),
      damage: 34,
      pulse: Math.random() * TAU,
    });
    return;
  }

  if (typeRoll < 0.73) {
    // naval mine drifting in current
    const side = Math.random() < 0.5 ? -1 : 1;
    const x = side < 0 ? view.left - 40 : view.right + 40;
    hazards.push({
      x,
      y: randRange(view.top + 70, view.bottom - 70),
      radius: 16,
      vx: -side * randRange(70, 140),
      vy: randRange(-22, 22),
      type: "mine",
      angle: Math.random() * TAU,
      angularVel: randRange(2.5, 4.8),
      damage: 48,
      pulse: Math.random() * TAU,
    });
    return;
  }

  // harpoon fired toward shark from edge
  const fireFromLeft = Math.random() < 0.5;
  const x = fireFromLeft ? view.left - 60 : view.right + 60;
  const y = randRange(view.top + 50, view.bottom - 50);
  const aimAngle = Math.atan2(player.y - y, player.x - x);
  const speed = randRange(290, 390);
  hazards.push({
    x,
    y,
    radius: 10,
    vx: Math.cos(aimAngle) * speed,
    vy: Math.sin(aimAngle) * speed,
    type: "harpoon",
    angle: aimAngle,
    angularVel: 0,
    damage: 40,
    pulse: Math.random() * TAU,
  });
}

// ═══════════════════════════════════════════════════════
//  PARTICLES
// ═══════════════════════════════════════════════════════
function spawnEatParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = (TAU / count) * i + randRange(-0.3, 0.3);
    const speed = randRange(60, 200);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: randRange(3, 8),
      life: 1,
      decay: randRange(0.9, 1.8),
      color,
      type: "circle",
    });
  }
  // sparkles
  for (let i = 0; i < 6; i++) {
    const angle = Math.random() * TAU;
    const speed = randRange(40, 120);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: randRange(2, 5),
      life: 1,
      decay: randRange(1.5, 2.5),
      color: "#fff",
      type: "star",
    });
  }
}

function spawnHitParticles(x, y) {
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * TAU;
    const speed = randRange(80, 250);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: randRange(4, 10),
      life: 1,
      decay: randRange(1.0, 2.0),
      color: i % 2 === 0 ? "#ff2d2d" : "#ff8800",
      type: "circle",
    });
  }
}

function spawnBloodParticles(x, y, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * TAU;
    const speed = randRange(30, 180);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: randRange(2, 6),
      life: 1,
      decay: randRange(0.5, 1.0),
      color: `hsl(${randRange(0, 30)}, 100%, 50%)`,
      type: "drop",
    });
  }
}

function addPopText(x, y, text, color) {
  popTexts.push({ x, y, text, color, life: 1, vy: -60, size: 18 });
}

// ═══════════════════════════════════════════════════════
//  SCREEN SHAKE
// ═══════════════════════════════════════════════════════
function triggerShake(mag) {
  shakeMag = Math.max(shakeMag, mag);
}

function getCurrentSharkStage() {
  return SHARK_STAGES[sharkStageIndex] || SHARK_STAGES[0];
}

function updateSharkFrame(dt, speedNorm) {
  if (sharkFrames.length <= 1) return;
  const fps = lerp(SHARK_IDLE_FPS, SHARK_SWIM_FPS, speedNorm);
  sharkFrameTimer += dt * fps;
  if (sharkFrameTimer >= 1) {
    const steps = Math.floor(sharkFrameTimer);
    sharkFrameTimer -= steps;
    sharkFrameIndex = (sharkFrameIndex + steps) % sharkFrames.length;
  }
}

function getDirectionFrameIndex(angle) {
  const step = TAU / 8;
  const normalized = (angle + TAU) % TAU;
  return Math.round(normalized / step) % 8;
}

function updateSpriteDirection(dt) {
  let da = player.angle - player.visualAngle;
  while (da > Math.PI) da -= TAU;
  while (da < -Math.PI) da += TAU;
  player.visualAngle += da * Math.min(1, dt * 10);

  player.spriteSwitchCooldown = Math.max(0, player.spriteSwitchCooldown - dt);
  const desired = getDirectionFrameIndex(player.visualAngle);
  if (desired !== player.spriteDirIndex && player.spriteSwitchCooldown <= 0) {
    player.spriteDirIndex = desired;
    player.spriteSwitchCooldown = lerp(0.085, 0.035, player.speedNorm);
  }
}

// ═══════════════════════════════════════════════════════
//  UPDATE
// ═══════════════════════════════════════════════════════
function update(dt) {
  dtCache = dt;
  // clamp dt against huge spikes
  dt = Math.min(dt, 0.05);
  updateAmbientMusic();

  // ── Difficulty by level progression (growth-based) ──
  spawnInterval = Math.max(0.45, 1.1 - (level - 1) * 0.08);

  // ── Grace period at game start ──
  startGraceTimer = Math.max(0, startGraceTimer - dt);
  tutorialTimer += dt;

  // ── Spawn ──
  spawnTimer += dt;
  const maxFish = 40 + level * 8;
  if (spawnTimer >= spawnInterval && fishes.length < maxFish) {
    spawnTimer = 0;
    const burst = 2 + Math.floor(level / 2);
    for (let i = 0; i < burst && fishes.length < maxFish; i++) {
      spawnFish();
    }
    if (Math.random() < 0.65 && fishes.length < maxFish) spawnFish();
  }

  // ── Hazard spawn (barrels/mines/spears style threats) ──
  if (startGraceTimer <= 0) hazardTimer += dt;
  const hazardInterval = Math.max(
    1.0,
    HAZARD_BASE_INTERVAL - (level - 1) * 0.22,
  );
  if (startGraceTimer <= 0 && hazardInterval - hazardTimer < 0.85) {
    dangerWarningTimer = Math.max(dangerWarningTimer, 0.9);
  }
  const maxHazards = 4 + level;
  if (
    startGraceTimer <= 0 &&
    hazardTimer >= hazardInterval &&
    hazards.length < maxHazards
  ) {
    hazardTimer = 0;
    spawnHazard();
    if (level >= 4 && Math.random() < 0.35) spawnHazard();
  }

  // ── Bubbles ──
  if (Math.random() < dt * 3) spawnBubble();
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    b.y -= b.speed * dt;
    b.wobble += dt * 1.5;
    b.x += Math.sin(b.wobble) * 8 * dt;
    const view = getViewInfo();
    if (
      b.y < view.top - b.r * 2 ||
      b.x < view.left - 220 ||
      b.x > view.right + 220
    ) {
      bubbles.splice(i, 1);
    }
  }

  // ── Player movement (mouse/touch steering, closer to Angry Sharks) ──
  keys.w = pressedMoveKeys.has("w");
  keys.a = pressedMoveKeys.has("a");
  keys.s = pressedMoveKeys.has("s");
  keys.d = pressedMoveKeys.has("d");
  const mouseWorld = screenToWorld(mouse.wx, mouse.wy);
  let keyX = 0;
  let keyY = 0;
  if (keys.a || keys.d) {
    if (keys.a && !keys.d) keyX = -1;
    else if (keys.d && !keys.a) keyX = 1;
    else keyX = keyPressOrder.a >= keyPressOrder.d ? -1 : 1;
  }
  if (keys.w || keys.s) {
    if (keys.w && !keys.s) keyY = -1;
    else if (keys.s && !keys.w) keyY = 1;
    else keyY = keyPressOrder.w >= keyPressOrder.s ? -1 : 1;
  }
  const useKeyboard =
    KEYBOARD_ONLY_MOVEMENT ? true : controlMode === "keyboard";
  const dx = mouseWorld.x - player.x;
  const dy = mouseWorld.y - player.y;
  const dist = Math.hypot(dx, dy);
  const sharkStage = getCurrentSharkStage();
  const maxSpeed = 470 * sharkStage.speedMul;
  const softZone = 16;
  const fullSpeedDist = 240;
  const idleDamping = 0.9;
  const cruiseDamping = 0.985;

  let desiredVx = 0;
  let desiredVy = 0;

  if (useKeyboard) {
    if (keyX !== 0 || keyY !== 0) {
      const kLen = Math.hypot(keyX, keyY);
      const knx = keyX / kLen;
      const kny = keyY / kLen;
      const targetSpeed = maxSpeed;
      desiredVx = knx * targetSpeed;
      desiredVy = kny * targetSpeed;
      player.targetAngle = Math.atan2(kny, knx);
    }
  } else if (dist > softZone) {
    const nx = dx / dist;
    const ny = dy / dist;
    const distT = clamp((dist - softZone) / (fullSpeedDist - softZone), 0, 1);
    const speedFactor = 0.18 + distT * distT * (3 - 2 * distT) * 0.82;
    const targetSpeed = maxSpeed * speedFactor;
    desiredVx = nx * targetSpeed;
    desiredVy = ny * targetSpeed;
    player.targetAngle = Math.atan2(dy, dx);
  }

  const steerStrength =
    useKeyboard ? 16 : lerp(8.4, 12.2, clamp(dist / fullSpeedDist, 0, 1));
  const followAlpha = 1 - Math.exp(-steerStrength * dt);
  if (useKeyboard && (keyX !== 0 || keyY !== 0)) {
    // Hard lock keyboard direction for instant response and no "stuck moving right" feel.
    player.vx = desiredVx;
    player.vy = desiredVy;
  } else {
    player.vx += (desiredVx - player.vx) * followAlpha;
    player.vy += (desiredVy - player.vy) * followAlpha;
  }

  const damping =
    useKeyboard ?
      keyX !== 0 || keyY !== 0 ?
        0.994
      : 0.86
    : dist > softZone ? cruiseDamping
    : idleDamping;
  player.vx *= Math.pow(damping, dt * 60);
  player.vy *= Math.pow(damping, dt * 60);

  const pspd = Math.hypot(player.vx, player.vy);
  if (pspd > maxSpeed) {
    const cap = maxSpeed / pspd;
    player.vx *= cap;
    player.vy *= cap;
  }

  // Fail-safe: keep movement values finite to prevent blank-screen runaway.
  if (!Number.isFinite(player.vx)) player.vx = 0;
  if (!Number.isFinite(player.vy)) player.vy = 0;
  if (!Number.isFinite(player.x)) player.x = 0;
  if (!Number.isFinite(player.y)) player.y = 0;

  let da = player.targetAngle - player.angle;
  while (da > Math.PI) da -= TAU;
  while (da < -Math.PI) da += TAU;
  const turnRate = useKeyboard ? 18 : lerp(7, 12, clamp(pspd / maxSpeed, 0, 1));
  player.angle += da * Math.min(1, dt * turnRate);

  player.x += player.vx * dt;
  player.y += player.vy * dt;

  // no screen-edge bounce: free-roam world (slither-like)

  // ── Living sprite motion (breathing + body sway + speed driven frame rate) ──
  const playerSpeed = Math.hypot(player.vx, player.vy);
  player.speedNorm = clamp(playerSpeed / 420, 0, 1);
  player.swimPhase += dt * (2.2 + player.speedNorm * 5.2);
  player.bobOffset =
    Math.sin(player.swimPhase) * (1.2 + player.speedNorm * 2.4);
  const tiltTarget = clamp(player.vy / 260, -0.28, 0.28);
  player.tilt += (tiltTarget - player.tilt) * Math.min(1, dt * 10);
  player.spriteStretch =
    1 + Math.sin(player.swimPhase * 1.9) * (0.02 + player.speedNorm * 0.03);
  updateSpriteDirection(dt);

  // ── Trail ──
  player.trail.unshift({ x: player.x, y: player.y });
  if (player.trail.length > 14) player.trail.pop();

  // ── Size animation ──
  playerSize += (sizeTarget - playerSize) * dt * 5;
  player.radius = PLAYER_BASE_RADIUS * playerSize;

  // ── Camera zoom out as shark grows ──
  const growthT = clamp((playerSize - 1) / (MAX_SIZE_GROW - 1), 0, 1);
  camera.targetZoom = lerp(1, 0.62, growthT);
  const camFollowAlpha = 1 - Math.exp(-8 * dt);
  const camZoomAlpha = 1 - Math.exp(-4.5 * dt);
  camera.x += (player.x - camera.x) * camFollowAlpha;
  camera.y += (player.y - camera.y) * camFollowAlpha;
  camera.zoom += (camera.targetZoom - camera.zoom) * camZoomAlpha;

  // ── Shark evolution unlock ──
  const unlockedStage = getSharkStageIndex(sizeTarget);
  if (unlockedStage > sharkStageIndex) {
    sharkStageIndex = unlockedStage;
    playSfxEvolve();
    addPopText(
      player.x,
      player.y - player.radius - 26,
      `${SHARK_STAGES[sharkStageIndex].name} FORM!`,
      SHARK_STAGES[sharkStageIndex].glow,
    );
    triggerShake(6);
  }

  // ── Level progression: grow enough size to advance ──
  const nextReq = getLevelSizeRequirement(level + 1);
  if (level < MAX_LEVEL && sizeTarget >= nextReq) {
    level += 1;
    maxDepth = Math.max(maxDepth, level);
    playSfxLevelUp();
    addPopText(
      player.x,
      player.y - player.radius - 20,
      `LEVEL ${level}!`,
      "#7efcff",
    );
    triggerShake(5);
  }

  // ── Eat animation ──
  player.eatAnim = Math.max(0, player.eatAnim - dt * 4);
  player.scaleAnim = 1 + player.eatAnim * 0.12;

  // ── Invincibility ──
  player.invincible = Math.max(0, player.invincible - dt);

  // ── Health drain ──
  if (startGraceTimer <= 0) health -= HEALTH_DRAIN * dt;
  if (health <= 0) {
    health = 0;
    gameOver();
    return;
  }

  // ── Combo timer ──
  if (comboCount > 0) {
    comboTimer -= dt;
    if (comboTimer <= 0) {
      comboCount = 0;
      comboTimer = 0;
    }
  }

  // ── Screen shake decay ──
  shakeMag *= Math.pow(0.05, dt);
  if (shakeMag < 0.1) shakeMag = 0;
  shakeX = (Math.random() - 0.5) * 2 * shakeMag;
  shakeY = (Math.random() - 0.5) * 2 * shakeMag;
  dangerWarningTimer = Math.max(0, dangerWarningTimer - dt);

  const playerR = player.radius;

  // ── Fish update ──
  for (let i = fishes.length - 1; i >= 0; i--) {
    const f = fishes[i];
    if (!f.alive) {
      fishes.splice(i, 1);
      continue;
    }

    // fade in
    f.opacity = Math.min(1, f.opacity + dt * 3);
    f.scale = Math.min(1, f.scale + dt * 4);

    // AI
    f.wobble += f.wobbleSpeed * dt;
    f.swimPhase += dt * f.swimFreq;
    f.turnTimer -= dt;
    f.burstTimer -= dt;

    const distToPlayer = Math.hypot(player.x - f.x, player.y - f.y);
    const edibleBoost =
      f.fishSpriteType && (f.type.tier === "tiny" || f.type.tier === "small") ?
        EDIBLE_FISH_SPEED_BOOST
      : 1;
    const whaleBossMul =
      f.isWhaleBoss ?
        f.whaleClass === "small" ? 1.02
        : f.whaleClass === "medium" ? 0.96
        : 0.9
      : 1;
    const baseSpeed =
      (f.type.baseSpeed + level * 4) * edibleBoost * whaleBossMul;
    const maxFishSpeed =
      baseSpeed * (f.isWhaleBoss ? 1.72 : 1.35 + f.aggression * 0.45);
    let steerX = 0;
    let steerY = 0;
    let steeringActive = false;

    // small fish should not flee when shark gets close
    if (f.type.tier === "tiny" || f.type.tier === "small") {
      f.fleeing = false;
      const laneAngle = f.angle + Math.sin(f.swimPhase * 0.65) * 0.22;
      const laneStrength = baseSpeed * (0.72 + f.aggression * 0.18);
      steerX += Math.cos(laneAngle) * laneStrength;
      steerY += Math.sin(laneAngle) * laneStrength;
      steeringActive = true;
    }

    // smarter pursuit/avoidance:
    // - medium fish may chase when bigger, flee when smaller
    // - large/boss fish actively predict player movement and burst
    if (
      f.type.tier === "medium" ||
      f.type.tier === "large" ||
      f.type.tier === "boss"
    ) {
      const canThreatenPlayer = f.radius > playerR * 0.92;
      const playerCanEat = playerR > f.radius * 1.1;

      if (canThreatenPlayer && distToPlayer < f.preferredDist * 2.1) {
        const lead = clamp(distToPlayer / 380, 0.12, 0.45);
        const targetX = player.x + player.vx * lead;
        const targetY = player.y + player.vy * lead;
        const tx = targetX - f.x;
        const ty = targetY - f.y;
        const tLen = Math.max(0.001, Math.hypot(tx, ty));
        const pursuitStrength =
          (f.type.tier === "boss" ? 370
          : f.type.tier === "large" ? 315
          : 248) * f.aggression;
        steerX += (tx / tLen) * pursuitStrength;
        steerY += (ty / tLen) * pursuitStrength;
        steeringActive = true;
      } else if (playerCanEat && distToPlayer < f.preferredDist * 1.6) {
        const ax = f.x - player.x;
        const ay = f.y - player.y;
        const aLen = Math.max(0.001, Math.hypot(ax, ay));
        const avoidStrength =
          (f.type.tier === "medium" ? 190 : 145) *
          (1.05 + (playerR - f.radius) / 90);
        steerX += (ax / aLen) * avoidStrength;
        steerY += (ay / aLen) * avoidStrength;
        steeringActive = true;
      }
    }

    // occasional burst to make fish feel alive and aggressive
    if (f.burstTimer <= 0) {
      f.burstTimer =
        (f.isWhaleBoss ? randRange(1.2, 2.4)
        : f.type.tier === "boss" ? randRange(0.45, 1.05)
        : randRange(0.8, 2.0)) / Math.max(0.72, f.aggression);
      const burstAngle = Math.atan2(f.vy, f.vx) + randRange(-0.55, 0.55);
      const burstStrength =
        (f.isWhaleBoss ? 180
        : f.type.tier === "boss" ? 250
        : f.type.tier === "large" ? 210
        : 140) * f.aggression;
      f.vx += Math.cos(burstAngle) * burstStrength * dt;
      f.vy += Math.sin(burstAngle) * burstStrength * dt;
    }

    // random wander
    if (f.turnTimer <= 0) {
      const denseTrafficFactor = clamp(fishes.length / 30, 0, 1);
      f.turnTimer = randRange(0.9, 2.4) * (1 - denseTrafficFactor * 0.25);
      const wanderAngle =
        Math.atan2(f.vy, f.vx) +
        randRange(-0.8, 0.8) +
        f.wanderBias * randRange(0.08, 0.22);
      const wanderStrength = baseSpeed * randRange(0.78, 1.18);
      f.vx += Math.cos(wanderAngle) * wanderStrength * dt * 3;
      f.vy += Math.sin(wanderAngle) * wanderStrength * dt * 3;
    }

    if (steeringActive) {
      f.vx += steerX * dt;
      f.vy += steerY * dt;
    }

    // drag
    const drag =
      f.isWhaleBoss ?
        steeringActive ? 0.955
        : 0.942
      : steeringActive ? 0.935
      : 0.912;
    f.vx *= Math.pow(drag, dt * 60);
    f.vy *= Math.pow(drag, dt * 60);

    // min speed
    const fspd = Math.hypot(f.vx, f.vy);
    const minSpd = baseSpeed * (steeringActive ? 0.58 : 0.42);
    if (fspd < minSpd) {
      f.vx *= minSpd / Math.max(fspd, 0.01);
      f.vy *= minSpd / Math.max(fspd, 0.01);
    }
    if (fspd > maxFishSpeed) {
      const cap = maxFishSpeed / Math.max(fspd, 0.001);
      f.vx *= cap;
      f.vy *= cap;
    }

    f.angle = Math.atan2(f.vy, f.vx);
    let da = f.angle - (f.visualAngle ?? f.angle);
    while (da > Math.PI) da -= TAU;
    while (da < -Math.PI) da += TAU;
    const smoothCfg = getFishTurnSmoothConfig();
    const turnSpeed =
      (f.turnResponsiveness || 9) *
      (f.isWhaleBoss ? 0.92 : 1) *
      smoothCfg.turnMul;
    f.visualAngle =
      (f.visualAngle ?? f.angle) + da * Math.min(1, dt * turnSpeed);
    const bankTarget = clamp(
      da * 0.7 * smoothCfg.bankMul,
      -smoothCfg.bankClamp,
      smoothCfg.bankClamp,
    );
    f.bankAngle =
      (f.bankAngle || 0) +
      (bankTarget - (f.bankAngle || 0)) *
        Math.min(1, dt * smoothCfg.bankCatchup);

    f.nemoDirCooldown = Math.max(0, f.nemoDirCooldown - dt);
    const desiredNemoDir = getDirectionFrameIndex(f.visualAngle);
    if (desiredNemoDir !== f.nemoDirIndex && f.nemoDirCooldown <= 0) {
      f.nemoDirIndex = desiredNemoDir;
      f.nemoDirCooldown = lerp(
        0.06,
        0.02,
        clamp(Math.hypot(f.vx, f.vy) / 280, 0, 1),
      );
    }
    f.x += f.vx * dt;
    f.y += f.vy * dt;

    // despawn if too far from player in world-space
    const despawnDist = getViewInfo().radius + 900;
    if (Math.hypot(f.x - player.x, f.y - player.y) > despawnDist) {
      fishes.splice(i, 1);
      continue;
    }

    // ── Collision with player ──
    const colDist = Math.hypot(player.x - f.x, player.y - f.y);
    const colThreshold = playerR * 0.82 + f.radius * f.scale * 0.82;

    if (colDist < colThreshold) {
      if (playerR >= f.radius * 1.05) {
        // EAT
        eatFish(f, i);
      } else if (playerR < f.radius * 0.92 && player.invincible <= 0) {
        // HURT
        hurtPlayer(f);
      }
    }
  }

  // ── Hazards (Bombs, Mines, Spikes) ──
  for (let i = hazards.length - 1; i >= 0; i--) {
    const h = hazards[i];
    h.x += h.vx * dt;
    h.y += h.vy * dt;
    h.angle += h.angularVel * dt;
    h.pulse += dt * 3.2;

    if (h.type === "mine") {
      h.vy += Math.sin(h.pulse) * 6 * dt;
    } else if (h.type === "barrel" && Math.random() < dt * 8) {
      particles.push({
        x: h.x + randRange(-6, 6),
        y: h.y + randRange(-6, 6),
        vx: randRange(-25, 25),
        vy: randRange(-40, -10),
        r: randRange(1.5, 3.5),
        life: 1,
        decay: randRange(0.8, 1.4),
        color: "rgba(142,255,91,0.9)",
        type: "drop",
      });
    }

    // Remove if outside camera viewport margin
    const view = getViewInfo();
    if (
      h.x < view.left - 220 ||
      h.x > view.right + 220 ||
      h.y < view.top - 220 ||
      h.y > view.bottom + 220
    ) {
      hazards.splice(i, 1);
      continue;
    }

    // ── Collision with player ──
    const hazColDist = Math.hypot(player.x - h.x, player.y - h.y);
    const hazColThreshold = playerR * 0.8 + h.radius;

    if (hazColDist < hazColThreshold && player.invincible <= 0) {
      // MINES = INSTANT DEATH
      if (h.type === "mine") {
        health = 0;
        spawnBloodParticles(h.x, h.y, 12);
        addPopText(h.x, h.y - 20, "TERKENA RANJAU!", "#ff2d2d");
        playSfxHazard();
        triggerShake(15);
        hazards.splice(i, 1);
      } else {
        // OTHER HAZARDS - damage reduced by unlocked shark stage
        const stage = getCurrentSharkStage();
        const finalDamage = Math.round(h.damage * stage.damageMul);
        health = Math.max(0, health - finalDamage);
        player.invincible = 1.5; // invincibility frames
        spawnHitParticles(h.x, h.y);
        spawnBloodParticles(h.x, h.y, 6);
        addPopText(h.x, h.y - 20, `-${finalDamage}`, "#ff2d2d");
        playSfxHazard();
        shakeMag = 8;
        hazards.splice(i, 1);
      }
    }
  }

  if (health <= 0) {
    health = 0;
    gameOver();
    return;
  }

  // ── Particles ──
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= Math.pow(0.88, dt * 60);
    p.vy *= Math.pow(0.88, dt * 60);
    p.vy += 30 * dt; // slight gravity
    p.life -= p.decay * dt;
    if (p.life <= 0) particles.splice(i, 1);
  }

  // ── Pop texts ──
  for (let i = popTexts.length - 1; i >= 0; i--) {
    const t = popTexts[i];
    t.y += t.vy * dt;
    t.vy *= Math.pow(0.85, dt * 60);
    t.life -= 1.4 * dt;
    if (t.life <= 0) popTexts.splice(i, 1);
  }

  // ── Update HUD ──
  updateMissionProgress();
  updateTutorial();
  updateHUD();
}

function updateTutorial() {
  if (state !== "play") {
    setTutorialTip("");
    setDangerWarning(false);
    return;
  }

  let nextStep = -1;
  for (let i = 0; i < TUTORIAL_STEPS.length; i++) {
    if (tutorialTimer >= TUTORIAL_STEPS[i].time) nextStep = i;
  }
  if (nextStep !== currentTutorialStep) {
    currentTutorialStep = nextStep;
    if (currentTutorialStep >= 0 && tutorialTimer <= 30) {
      setTutorialTip(TUTORIAL_STEPS[currentTutorialStep].text);
    }
  }
  if (tutorialTimer > 30) setTutorialTip("");
  setDangerWarning(dangerWarningTimer > 0 && state === "play");
}

function eatFish(f, i) {
  if (!f.alive) return;
  f.alive = false;

  comboCount++;
  comboTimer = COMBO_WINDOW;
  playSfxEat(comboCount);
  if (comboCount > bestCombo) bestCombo = comboCount;

  const pts = f.type.points * comboCount;
  score += pts;
  eaten++;
  if (MISSIONS[missionIndex] && MISSIONS[missionIndex].id === "eat_small") {
    if (f.type.tier === "tiny" || f.type.tier === "small") missionProgress += 1;
  }

  health = Math.min(MAX_HEALTH, health + HEALTH_EAT);

  // grow
  const growAmount = (f.radius / (PLAYER_BASE_RADIUS * 2)) * 0.08;
  sizeTarget = Math.min(MAX_SIZE_GROW, sizeTarget + growAmount);

  // special fish bonus to mirror Angry Sharks loop
  if (f.bonusType === "heart") {
    health = Math.min(MAX_HEALTH, health + 22);
    playSfxHeart();
    addPopText(f.x, f.y - f.radius - 14, "PENYEMBUH +", "#7dff8a");
  } else if (f.bonusType === "gold") {
    playSfxGold();
    score += 120;
    player.invincible = Math.max(player.invincible, 1.4);
    sizeTarget = Math.min(MAX_SIZE_GROW, sizeTarget + 0.05);
    addPopText(f.x, f.y - f.radius - 14, "EMAS +120", "#ffd84d");
  }

  // eat animation
  player.eatAnim = 1;

  // particles
  spawnEatParticles(f.x, f.y, f.type.color1, 10 + Math.floor(f.radius));
  if (comboCount >= 3) {
    spawnEatParticles(f.x, f.y, "#fff", 6);
    triggerShake(2);
  }

  // pop text
  const label = comboCount >= 3 ? `x${comboCount} COMBO! +${pts}` : `+${pts}`;
  const col =
    comboCount >= 5 ? "#ff9f43"
    : comboCount >= 3 ? "#ffd32a"
    : "#fff";
  addPopText(f.x, f.y - f.radius, label, col);

  if (comboCount >= 3) triggerShake(3);
}

function hurtPlayer(f) {
  playSfxHurt();
  player.invincible = 2.0;
  const stage = getCurrentSharkStage();
  const damage = Math.round(30 * stage.damageMul);
  health = Math.max(0, health - damage);
  comboCount = 0;
  comboTimer = 0;

  spawnHitParticles(player.x, player.y);
  spawnBloodParticles(player.x, player.y, 8);
  triggerShake(12);

  addPopText(
    player.x,
    player.y - player.radius - 10,
    `BAHAYA -${damage}`,
    "#ff2d2d",
  );

  if (health <= 0) {
    health = 0;
    gameOver();
  }
}

// ═══════════════════════════════════════════════════════
//  HUD UPDATE
// ═══════════════════════════════════════════════════════
function updateHUD() {
  scoreEl.textContent = score;
  levelEl.textContent = level;
  comboEl.textContent = "x" + Math.max(1, comboCount);
  eatenEl.textContent = eaten;
  const mission = MISSIONS[missionIndex];
  if (missionTextEl && mission)
    missionTextEl.textContent = getMissionProgressText(mission);

  const hp = health / MAX_HEALTH;
  healthBar.style.width = hp * 100 + "%";
  if (hp > 0.6) {
    healthBar.style.background = "linear-gradient(90deg, #39ff14, #a8ff3e)";
    healthBar.style.boxShadow = "0 0 8px #39ff14";
  } else if (hp > 0.3) {
    healthBar.style.background = "linear-gradient(90deg, #ffe100, #ff9f43)";
    healthBar.style.boxShadow = "0 0 8px #ffe100";
  } else {
    healthBar.style.background = "linear-gradient(90deg, #ff2d2d, #ff6b6b)";
    healthBar.style.boxShadow = "0 0 12px #ff2d2d";
  }
}

// ═══════════════════════════════════════════════════════
//  DRAW
// ═══════════════════════════════════════════════════════
function draw(t) {
  // clear full frame in screen space before camera transform
  ctx.save();
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.restore();

  ctx.save();
  ctx.translate(shakeX, shakeY);
  ctx.translate(W * 0.5, H * 0.5);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  drawBackground(t);
  drawBubbles(t);
  drawPlayerTrail();
  drawFishes(t);
  drawHazards(t);
  drawPlayer(t);
  drawParticles();
  drawPopTexts();

  ctx.restore();
}

// ── Background ──
function drawBackground(t) {
  const viewW = W / Math.max(camera.zoom, 0.001);
  const viewH = H / Math.max(camera.zoom, 0.001);
  const left = camera.x - viewW * 0.5;
  const top = camera.y - viewH * 0.5;

  // deep ocean gradient
  const grad = ctx.createLinearGradient(0, top, 0, top + viewH);
  grad.addColorStop(0, "#020d1e");
  grad.addColorStop(0.4, "#041a36");
  grad.addColorStop(1, "#01080f");
  ctx.fillStyle = grad;
  ctx.fillRect(left, top, viewW, viewH);

  // subtle caustic light rays
  ctx.save();
  ctx.globalAlpha = 0.03 + 0.02 * Math.sin(t * 0.4);
  for (let i = 0; i < 6; i++) {
    const rx = left + viewW * (0.1 + i * 0.16) + Math.sin(t * 0.2 + i) * 30;
    const rayGrad = ctx.createLinearGradient(
      rx,
      top,
      rx + 60,
      top + viewH * 0.6,
    );
    rayGrad.addColorStop(0, "rgba(60,160,255,0.8)");
    rayGrad.addColorStop(1, "transparent");
    ctx.fillStyle = rayGrad;
    ctx.beginPath();
    ctx.moveTo(rx - 20, top);
    ctx.lineTo(rx + 80, top);
    ctx.lineTo(rx + 40, top + viewH * 0.6);
    ctx.lineTo(rx - 60, top + viewH * 0.6);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // seabed
  ctx.save();
  const seabedTop = top + viewH - 60;
  const sbGrad = ctx.createLinearGradient(0, seabedTop, 0, top + viewH);
  sbGrad.addColorStop(0, "transparent");
  sbGrad.addColorStop(1, "rgba(0,15,30,0.9)");
  ctx.fillStyle = sbGrad;
  ctx.fillRect(left, seabedTop, viewW, 60);
  ctx.restore();
}

// ── Bubbles ──
function drawBubbles(t) {
  ctx.save();
  for (const b of bubbles) {
    ctx.globalAlpha = b.opacity * Math.min(1, b.life ?? 1);
    ctx.strokeStyle = "rgba(130,220,255,0.8)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(b.x + Math.sin(b.wobble) * 4, b.y, b.r, 0, TAU);
    ctx.stroke();
    // shimmer
    ctx.globalAlpha = b.opacity * 0.5;
    ctx.fillStyle = "rgba(200,240,255,0.4)";
    ctx.beginPath();
    ctx.arc(
      b.x + Math.sin(b.wobble) * 4 - b.r * 0.25,
      b.y - b.r * 0.25,
      b.r * 0.35,
      0,
      TAU,
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ── Player trail ──
function drawPlayerTrail() {
  if (player.trail.length < 2) return;
  ctx.save();
  const pr = player.radius;
  for (let i = 0; i < player.trail.length; i++) {
    const tr = player.trail[i];
    const frac = 1 - i / player.trail.length;
    ctx.globalAlpha = frac * 0.18;
    ctx.fillStyle = "#00c8ff";
    ctx.beginPath();
    ctx.arc(tr.x, tr.y, pr * frac * 0.55, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ── Draw Hazards ──
function drawHazards(t) {
  for (const h of hazards) {
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(h.angle);

    if (h.type === "barrel") {
      // toxic barrel
      ctx.fillStyle = "#6b5824";
      ctx.fillRect(-h.radius * 0.85, -h.radius, h.radius * 1.7, h.radius * 2);
      ctx.fillStyle = "#303030";
      ctx.fillRect(
        -h.radius * 0.9,
        -h.radius * 0.95,
        h.radius * 1.8,
        h.radius * 0.22,
      );
      ctx.fillRect(
        -h.radius * 0.9,
        h.radius * 0.73,
        h.radius * 1.8,
        h.radius * 0.22,
      );
      ctx.strokeStyle = "#a2ff52";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-h.radius * 0.25, -h.radius * 0.2);
      ctx.lineTo(0, h.radius * 0.05);
      ctx.lineTo(-h.radius * 0.2, h.radius * 0.35);
      ctx.stroke();
      ctx.globalAlpha = 0.2 + Math.abs(Math.sin(h.pulse)) * 0.2;
      ctx.fillStyle = "#93ff5f";
      ctx.beginPath();
      ctx.arc(0, 0, h.radius * 1.4, 0, TAU);
      ctx.fill();
    } else if (h.type === "mine") {
      // naval mine (spiky)
      ctx.fillStyle = "#7a0000";
      ctx.beginPath();
      ctx.arc(0, 0, h.radius, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "#ff3131";
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const a = (TAU / 8) * i;
        ctx.beginPath();
        ctx.moveTo(
          Math.cos(a) * h.radius * 0.65,
          Math.sin(a) * h.radius * 0.65,
        );
        ctx.lineTo(
          Math.cos(a) * h.radius * 1.45,
          Math.sin(a) * h.radius * 1.45,
        );
        ctx.stroke();
      }
      ctx.globalAlpha = 0.2 + Math.abs(Math.sin(h.pulse * 1.3)) * 0.18;
      ctx.fillStyle = "#ff5151";
      ctx.beginPath();
      ctx.arc(0, 0, h.radius * 1.3, 0, TAU);
      ctx.fill();
    } else if (h.type === "harpoon") {
      // harpoon projectile
      const len = h.radius * 3.4;
      ctx.fillStyle = "#d7dce4";
      ctx.fillRect(-len * 0.45, -h.radius * 0.22, len * 0.9, h.radius * 0.44);
      ctx.fillStyle = "#8ea2b6";
      ctx.fillRect(-len * 0.58, -h.radius * 0.15, len * 0.2, h.radius * 0.3);
      ctx.fillStyle = "#f2f4f8";
      ctx.beginPath();
      ctx.moveTo(len * 0.45, 0);
      ctx.lineTo(len * 0.15, -h.radius * 0.55);
      ctx.lineTo(len * 0.15, h.radius * 0.55);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}

// ── Draw fish ──
function drawFishes(t) {
  for (const f of fishes) {
    ctx.save();
    ctx.globalAlpha = f.opacity;
    ctx.translate(f.x, f.y);
    ctx.scale(f.scale, f.scale);
    const wobbleY = Math.sin(f.wobble * 2) * 2;
    ctx.translate(0, wobbleY);
    const visualAngle = f.visualAngle ?? f.angle;
    const bank = f.bankAngle || 0;
    const spriteSet =
      f.fishSpriteType === "nemo" ? nemoDirSprites
      : f.fishSpriteType === "realistic" ? realisticDirSprites
      : f.fishSpriteType === "yellow" ? yellowDirSprites
      : f.fishSpriteType === "barakuda" ? barakudaDirSprites
      : f.fishSpriteType === "whale" ? whaleDirSprites
      : null;
    if (spriteSet && spriteSet[0]) {
      ctx.rotate(bank);
      drawDirectionalFish(ctx, f, t, spriteSet);
    } else {
      // face direction of travel
      ctx.rotate(visualAngle + bank * 0.55);
      if (Math.cos(visualAngle) < 0) ctx.scale(1, -1);
      drawFishShape(ctx, f.type, f.radius, t);
    }
    if (f.bonusType) drawFishBonusMark(ctx, f.bonusType, f.radius);
    ctx.restore();
  }
}

function drawDirectionalFish(c, fish, t, spriteSet = nemoDirSprites) {
  const r = fish.radius;
  const dirIndex = fish.nemoDirIndex || 0;
  const sprite = spriteSet[dirIndex] || spriteSet[0];
  if (!sprite) return;
  const fw = sprite.naturalWidth || sprite.width;
  const fh = sprite.naturalHeight || sprite.height;
  const ratio = fw / Math.max(1, fh);
  const pulse = Math.sin(fish.swimPhase + t * 0.2);
  const speedNorm = clamp(Math.hypot(fish.vx, fish.vy) / 260, 0, 1);
  const stretch = 1 + pulse * fish.swimAmp;
  const squeeze = 1 - pulse * fish.swimAmp * 0.62;
  const tilt = Math.sin(fish.swimPhase * 0.8) * (0.04 + speedNorm * 0.06);
  const drawH = r * 2.28 * (fish.drawScaleMul || 1);
  const drawW = drawH * ratio;
  c.rotate(tilt);
  c.scale(stretch, squeeze);
  c.drawImage(sprite, -drawW * 0.5, -drawH * 0.5, drawW, drawH);
}

function drawFishBonusMark(c, bonusType, r) {
  c.save();
  c.translate(-r * 0.05, -r * 0.05);
  if (bonusType === "heart") {
    c.fillStyle = "#8dff8d";
    c.beginPath();
    c.moveTo(0, r * 0.05);
    c.bezierCurveTo(-r * 0.22, -r * 0.22, -r * 0.5, r * 0.12, 0, r * 0.45);
    c.bezierCurveTo(r * 0.5, r * 0.12, r * 0.22, -r * 0.22, 0, r * 0.05);
    c.fill();
  } else if (bonusType === "gold") {
    c.fillStyle = "#ffd34d";
    c.beginPath();
    c.arc(0, 0, r * 0.22, 0, TAU);
    c.fill();
    c.strokeStyle = "rgba(255,255,255,0.8)";
    c.lineWidth = Math.max(1, r * 0.05);
    c.beginPath();
    c.moveTo(-r * 0.08, 0);
    c.lineTo(r * 0.08, 0);
    c.stroke();
  }
  c.restore();
}

function drawFishShape(c, type, r, t) {
  const bodyW = r * 2;
  const bodyH = r * 1.1;

  // tail wag
  const wagAngle = Math.sin(t * 5 + r) * 0.35;

  // ── tail ──
  c.save();
  c.translate(-bodyW * 0.55, 0);
  c.rotate(wagAngle);
  c.fillStyle = type.finColor;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(-r * 0.85, -r * 0.65);
  c.lineTo(-r * 0.6, 0);
  c.lineTo(-r * 0.85, r * 0.65);
  c.closePath();
  c.fill();
  c.restore();

  // ── body ──
  c.fillStyle = type.color1;
  c.beginPath();
  c.ellipse(0, 0, bodyW * 0.55, bodyH * 0.5, 0, 0, TAU);
  c.fill();

  // body gradient sheen
  const sheen = c.createRadialGradient(
    -bodyW * 0.15,
    -bodyH * 0.18,
    0,
    0,
    0,
    bodyW * 0.55,
  );
  sheen.addColorStop(0, "rgba(255,255,255,0.35)");
  sheen.addColorStop(0.5, "rgba(255,255,255,0.08)");
  sheen.addColorStop(1, "rgba(0,0,0,0.15)");
  c.fillStyle = sheen;
  c.beginPath();
  c.ellipse(0, 0, bodyW * 0.55, bodyH * 0.5, 0, 0, TAU);
  c.fill();

  // belly
  c.fillStyle = "rgba(255,255,255,0.22)";
  c.beginPath();
  c.ellipse(bodyW * 0.08, bodyH * 0.1, bodyW * 0.3, bodyH * 0.22, 0.2, 0, TAU);
  c.fill();

  // ── dorsal fin ──
  c.fillStyle = type.finColor;
  c.beginPath();
  c.moveTo(-bodyW * 0.1, -bodyH * 0.48);
  c.lineTo(bodyW * 0.18, -bodyH * 0.48 - r * 0.55);
  c.lineTo(bodyW * 0.3, -bodyH * 0.48);
  c.closePath();
  c.fill();

  // pectoral fin
  c.fillStyle = type.color2;
  c.beginPath();
  c.moveTo(bodyW * 0.1, bodyH * 0.2);
  c.lineTo(bodyW * 0.1, bodyH * 0.48 + r * 0.35);
  c.lineTo(-bodyW * 0.15, bodyH * 0.38);
  c.closePath();
  c.fill();

  // ── eye ──
  const eyeX = bodyW * 0.32,
    eyeY = -bodyH * 0.12;
  const eyeR = Math.max(2, r * 0.19);
  c.fillStyle = "#fff";
  c.beginPath();
  c.arc(eyeX, eyeY, eyeR, 0, TAU);
  c.fill();
  c.fillStyle = "#111";
  c.beginPath();
  c.arc(eyeX + eyeR * 0.2, eyeY, eyeR * 0.6, 0, TAU);
  c.fill();
  // highlight
  c.fillStyle = "rgba(255,255,255,0.7)";
  c.beginPath();
  c.arc(eyeX + eyeR * 0.35, eyeY - eyeR * 0.3, eyeR * 0.28, 0, TAU);
  c.fill();

  // ── special features for large/boss ──
  if (type.tier === "large" || type.tier === "boss") {
    // angry brow
    c.strokeStyle = "#222";
    c.lineWidth = Math.max(1.5, r * 0.07);
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(eyeX - eyeR * 0.8, eyeY - eyeR * 1.1);
    c.lineTo(eyeX + eyeR * 0.8, eyeY - eyeR * 0.5);
    c.stroke();

    // teeth
    const teethCount = type.tier === "boss" ? 5 : 3;
    const mouthX = bodyW * 0.48;
    const mouthY = bodyH * 0.1;
    const toothW = r * 0.1;
    const toothH = r * 0.18;
    c.fillStyle = "#fff";
    for (let i = 0; i < teethCount; i++) {
      const tx = mouthX - i * (toothW * 1.2);
      c.beginPath();
      c.moveTo(tx, mouthY);
      c.lineTo(tx - toothW * 0.5, mouthY + toothH);
      c.lineTo(tx - toothW, mouthY);
      c.closePath();
      c.fill();
    }
  }

  // outline
  c.strokeStyle = "rgba(0,0,0,0.3)";
  c.lineWidth = Math.max(1, r * 0.06);
  c.beginPath();
  c.ellipse(0, 0, bodyW * 0.55, bodyH * 0.5, 0, 0, TAU);
  c.stroke();
}

// ── Draw Player Shark ──
function drawPlayer(t) {
  if (state === "over") return;
  const pr = player.radius;
  const sc = player.scaleAnim;

  // soft shadow to ground the sprite in water
  ctx.save();
  ctx.translate(player.x, player.y + pr * 0.58 + player.bobOffset * 0.35);
  ctx.scale(sc, sc);
  ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
  ctx.beginPath();
  ctx.ellipse(0, 0, pr * 1.15, pr * 0.34, 0, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(player.x, player.y + player.bobOffset);
  ctx.scale(sc, sc);

  // invincibility flicker
  if (player.invincible > 0) {
    const flicker = Math.floor(t * 10) % 2 === 0;
    ctx.globalAlpha = flicker ? 0.5 : 1;
  }

  // Draw shark directional frame
  if (sharkFrames.length > 0) {
    const dirIdx = player.spriteDirIndex;
    const frame = sharkFrames[dirIdx] || sharkFrames[0];
    const isCanvasFrame =
      typeof HTMLCanvasElement !== "undefined" &&
      frame instanceof HTMLCanvasElement;
    const isReadyImage =
      frame && typeof frame.complete === "boolean" ? frame.complete : false;
    if (frame && (isCanvasFrame || isReadyImage)) {
      const fw = frame.naturalWidth || frame.width;
      const fh = frame.naturalHeight || frame.height;
      const imgRatio = fw / Math.max(1, fh);
      const drawH = pr * 2.5;
      const drawW = drawH * imgRatio;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.globalAlpha = 1;
      ctx.drawImage(frame, -drawW / 2, -drawH / 2, drawW, drawH);
    } else {
      drawSharkShape(ctx, pr, t);
    }
  } else {
    drawSharkShape(ctx, pr, t);
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawSharkShape(c, r, t) {
  const bW = r * 2;
  const bH = r * 0.85;

  // tail wag
  const wag = Math.sin(t * 6) * 0.38;
  c.save();
  c.translate(-bW * 0.62, 0);
  c.rotate(wag);
  // tail fin
  c.fillStyle = "#1a7fcf";
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(-r * 0.95, -r * 0.8);
  c.lineTo(-r * 0.5, 0);
  c.lineTo(-r * 0.95, r * 0.8);
  c.closePath();
  c.fill();
  c.restore();

  // body
  c.fillStyle = "#2196c8";
  c.beginPath();
  c.ellipse(0, 0, bW * 0.58, bH * 0.5, 0, 0, TAU);
  c.fill();

  // gradient sheen
  const sheen = c.createRadialGradient(-bW * 0.1, -bH * 0.2, 0, 0, 0, bW * 0.6);
  sheen.addColorStop(0, "rgba(100,220,255,0.45)");
  sheen.addColorStop(0.5, "rgba(60,160,230,0.12)");
  sheen.addColorStop(1, "rgba(0,30,80,0.3)");
  c.fillStyle = sheen;
  c.beginPath();
  c.ellipse(0, 0, bW * 0.58, bH * 0.5, 0, 0, TAU);
  c.fill();

  // belly (white)
  c.fillStyle = "rgba(230,245,255,0.6)";
  c.beginPath();
  c.ellipse(bW * 0.1, bH * 0.14, bW * 0.35, bH * 0.25, 0.3, 0, TAU);
  c.fill();

  // dorsal fin
  c.fillStyle = "#1565a0";
  c.beginPath();
  c.moveTo(-bW * 0.05, -bH * 0.48);
  c.lineTo(bW * 0.25, -bH * 0.48 - r * 0.72);
  c.lineTo(bW * 0.4, -bH * 0.48);
  c.closePath();
  c.fill();

  // pectoral fin
  c.fillStyle = "#1976a8";
  c.beginPath();
  c.moveTo(bW * 0.1, bH * 0.22);
  c.lineTo(bW * 0.05, bH * 0.5 + r * 0.45);
  c.lineTo(-bW * 0.18, bH * 0.42);
  c.closePath();
  c.fill();

  // snout extension
  c.fillStyle = "#1e8bb5";
  c.beginPath();
  c.moveTo(bW * 0.55, -bH * 0.15);
  c.lineTo(bW * 0.95, 0);
  c.lineTo(bW * 0.55, bH * 0.15);
  c.closePath();
  c.fill();

  // mouth
  c.strokeStyle = "#0a3d5c";
  c.lineWidth = Math.max(1.5, r * 0.06);
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(bW * 0.68, bH * 0.08);
  c.quadraticCurveTo(bW * 0.82, bH * 0.22, bW * 0.55, bH * 0.18);
  c.stroke();

  // teeth (top)
  c.fillStyle = "#eef";
  for (let i = 0; i < 4; i++) {
    const tx = bW * 0.62 + i * (r * 0.11);
    c.beginPath();
    c.moveTo(tx, bH * 0.12);
    c.lineTo(tx + r * 0.055, bH * 0.23);
    c.lineTo(tx + r * 0.11, bH * 0.12);
    c.closePath();
    c.fill();
  }

  // eye
  const eyeX = bW * 0.34,
    eyeY = -bH * 0.15;
  const eyeR = Math.max(3, r * 0.2);
  c.fillStyle = "#fff";
  c.beginPath();
  c.arc(eyeX, eyeY, eyeR, 0, TAU);
  c.fill();
  c.fillStyle = "#111b2e";
  c.beginPath();
  c.arc(eyeX + eyeR * 0.25, eyeY, eyeR * 0.62, 0, TAU);
  c.fill();
  c.fillStyle = "rgba(255,255,255,0.75)";
  c.beginPath();
  c.arc(eyeX + eyeR * 0.45, eyeY - eyeR * 0.3, eyeR * 0.28, 0, TAU);
  c.fill();

  // outline
  c.strokeStyle = "rgba(0,30,60,0.4)";
  c.lineWidth = Math.max(1.5, r * 0.07);
  c.beginPath();
  c.ellipse(0, 0, bW * 0.58, bH * 0.5, 0, 0, TAU);
  c.stroke();
}

// ── Particles ──
function drawParticles() {
  ctx.save();
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    if (p.type === "star") {
      drawStar(ctx, p.x, p.y, p.r);
    } else if (p.type === "drop") {
      ctx.ellipse(p.x, p.y, p.r * 0.55, p.r, 0, 0, TAU);
      ctx.fill();
    } else {
      ctx.arc(p.x, p.y, p.r * p.life, 0, TAU);
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawStar(c, x, y, r) {
  const spikes = 4;
  const inner = r * 0.4;
  c.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const a = (Math.PI / spikes) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : inner;
    i === 0 ?
      c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
    : c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath();
  c.fill();
}

// ── Pop texts ──
function drawPopTexts() {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const t of popTexts) {
    ctx.globalAlpha = Math.max(0, t.life);
    ctx.shadowColor = t.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = t.color;
    ctx.font = `bold ${t.size + (1 - t.life) * 6}px Orbitron, monospace`;
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ═══════════════════════════════════════════════════════
//  MAIN LOOP
// ═══════════════════════════════════════════════════════
function loop(now) {
  if (state !== "play") return;
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  update(dt);
  draw(now / 1000);

  requestAnimationFrame(loop);
}

// ═══════════════════════════════════════════════════════
//  UTILS
// ═══════════════════════════════════════════════════════
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function getLevelSizeRequirement(targetLevel) {
  if (targetLevel <= 1) return 1;
  return Math.min(MAX_SIZE_GROW, 1 + (targetLevel - 1) * 0.28);
}
function getSharkStageIndex(sizeVal) {
  let idx = 0;
  for (let i = 0; i < SHARK_STAGES.length; i++) {
    if (sizeVal >= SHARK_STAGES[i].sizeReq) idx = i;
  }
  return idx;
}
function randRange(a, b) {
  return a + Math.random() * (b - a);
}

// ── show start screen ──
showScreen(startScr);
