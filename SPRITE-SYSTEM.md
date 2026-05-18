# 🦈 Angry Sharks - Sprite Animation System

Sistem animasi sprite profesional untuk game Angry Sharks dengan karakter shark berjalan.

## 📁 Struktur Folder

```
Angry Sharks/
├── assets/
│   ├── sprites/
│   │   ├── shark-walk-1.jpeg
│   │   ├── shark-walk-2.jpeg
│   │   ├── shark-walk-3.jpeg
│   │   └── shark-walk-4.jpeg
│   ├── backgrounds/
│   ├── sounds/
│   └── ui/
├── js/
│   ├── SpriteAnimator.js    (⭐ Core sprite system)
│   └── game.js              (Game controller)
├── css/
│   └── sprite-animator.css  (Styling)
├── index.html               (Main game)
├── shark-demo.html          (⭐ Demo animasi shark)
└── SPRITE-SYSTEM.md         (Dokumentasi ini)
```

## 🎮 Cara Menggunakan

### 1. **Lihat Demo**

Buka `shark-demo.html` di browser untuk melihat animasi shark berjalan.

```
http://localhost/shark-demo.html
```

### 2. **Gunakan di Game Anda**

Tambahkan di HTML:

```html
<script src="js/SpriteAnimator.js"></script>
<script src="js/game.js"></script>
```

### 3. **Buat Instance Animator**

```javascript
const config = {
  frameCount: 4,
  framePath: (num) => `assets/sprites/shark-walk-${num}.jpeg`,
  animationSpeed: 0.1,
  startX: 50,
  startY: 150,
  width: 150,
  height: 150,
  speed: 3,
  direction: 1,
};

const animator = new SpriteAnimator("gameCanvas", config);
animator.play();
```

## 🎮 Kontrol

### Mouse/Touch

- 🖱️ **Mulai** - Tombol "Mulai"
- ⏸️ **Pause** - Tombol "Pause"
- ↻ **Reset** - Tombol "Reset"

### Keyboard

- **SPACE** - Play/Pause
- **R** - Reset
- **← / →** - Ubah arah

## 📚 API Reference

### SpriteAnimator Class

#### Constructor

```javascript
new SpriteAnimator(canvasId, spriteConfig);
```

#### Methods

- `play()` - Mulai animasi
- `pause()` - Jeda animasi
- `stop()` - Stop & reset
- `setAnimationSpeed(speed)` - Set kecepatan frame (0.05-0.5)
- `setMovementSpeed(speed)` - Set kecepatan gerakan (1-10)
- `setDirection(direction)` - Ubah arah (-1 atau 1)

#### Events

```javascript
animator.on("framesLoaded", () => {});
animator.on("animationStart", () => {});
animator.on("animationPause", () => {});
animator.on("animationStop", () => {});
animator.on("animationLoop", () => {});
animator.on("bounce", () => {});
```

## 🎨 Konfigurasi

```javascript
{
    frameCount: 4,                           // Jumlah frame
    framePath: (frameNum) => `...`,         // Path template
    animationSpeed: 0.1,                    // Kecepatan animasi (0.05-0.5)
    startX: 50,                             // Posisi awal X
    startY: 150,                            // Posisi awal Y
    width: 150,                             // Lebar sprite
    height: 150,                            // Tinggi sprite
    direction: 1,                           // Arah (1 atau -1)
    speed: 3,                               // Kecepatan gerakan
    debug: false                            // Tampilkan debug info
}
```

## ✨ Features

✅ Smooth frame animation  
✅ Automatic direction flipping  
✅ Bounce at canvas edges  
✅ Bubble effects background  
✅ Real-time frame tracking  
✅ Event system  
✅ Keyboard + button controls  
✅ Responsive design  
✅ Mobile friendly

## 🚀 Advanced Usage

### Custom Background

```javascript
animator.drawBackground = function () {
  // Custom drawing code
};
```

### Add Physics

```javascript
animator.on("animationLoop", () => {
  // Add physics logic
});
```

### Multiple Sprites

```javascript
const shark1 = new SpriteAnimator("canvas1", config1);
const shark2 = new SpriteAnimator("canvas2", config2);

shark1.play();
shark2.play();
```

## 🐛 Troubleshooting

### Gambar tidak muncul

- ✅ Pastikan path relatif benar
- ✅ Cek console untuk error loading
- ✅ Gunakan developer tools (F12)

### Animasi tidak smooth

- ✅ Kurangi `animationSpeed` (misal 0.08)
- ✅ Periksa browser performance
- ✅ Reduce canvas resolution

### Sprite terputus

- ✅ Sesuaikan `width` dan `height` dengan ukuran gambar
- ✅ Adjust `startY` position

## 📝 Lisensi

Untuk project Angry Sharks. Gunakan sesuai kebutuhan.

## 🔧 Maintenance

**Last Updated:** April 27, 2026  
**Version:** 1.0.0  
**Created by:** Angry Sharks Team

---

Untuk pertanyaan atau saran, hubungi tim development!
