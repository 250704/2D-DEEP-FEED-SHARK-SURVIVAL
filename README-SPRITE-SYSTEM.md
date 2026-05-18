# 🦈 ANGRY SHARKS - Sprite Animation System

## 📌 Ringkasan

Sistem animasi sprite profesional yang telah diimplementasikan untuk game **Angry Sharks** dengan fitur:

- ✅ **Sprite Animation** - Animasi karakter shark berjalan dengan 4 frame
- ✅ **Game Controller** - Sistem kontrol animasi dengan keyboard & button
- ✅ **Organized Assets** - Folder struktur yang terorganisir
- ✅ **Professional Code** - Kode yang clean, modular, dan reusable

---

## 📂 File Structure

```
Angry Sharks/
│
├── 📁 assets/
│   ├── 📁 sprites/               ⭐ Asset sprite
│   │   ├── shark-walk-1.jpeg
│   │   ├── shark-walk-2.jpeg
│   │   ├── shark-walk-3.jpeg
│   │   └── shark-walk-4.jpeg
│   ├── 📁 backgrounds/           (untuk background ke depan)
│   ├── 📁 sounds/                (untuk audio ke depan)
│   ├── 📁 ui/                    (untuk UI elements ke depan)
│   └── 📁 berjalan/              (deprecated - sudah dimindahkan)
│
├── 📁 js/                        ⭐ Game Scripts
│   ├── SpriteAnimator.js         (Core sprite animation engine)
│   └── game.js                   (Game controller & logic)
│
├── 📁 css/
│   └── sprite-animator.css       (Styling untuk demo)
│
├── 📁 config/
│   └── sprites.json              (Sprite configuration)
│
├── 🎮 shark-demo.html            ⭐ DEMO ANIMASI (Buka ini!)
├── 📄 index.html                 (Main game - integrate di sini)
├── 📄 SPRITE-SYSTEM.md           (Technical documentation)
└── 📄 README.md                  (File ini)
```

---

## 🚀 Quick Start

### 1. **Lihat Demo Animasi**

Buka file `shark-demo.html` di browser:

```
File → Open → shark-demo.html
```

Atau dengan double-click di file explorer.

### 2. **Kontrol Animasi**

**🖱 Mouse Controls:**

- Click "▶ Mulai" - Jalankan animasi
- Click "⏸ Pause" - Pause animasi
- Click "↻ Reset" - Reset ke awal

**⌨️ Keyboard Controls:**

- **SPACE** - Play/Pause
- **R** - Reset
- **← / →** - Ubah arah

### 3. **Integrate ke Game Utama**

Di `index.html`, tambahkan setelah `<canvas>` tag:

```html
<!-- Sprite Animation System -->
<script src="js/SpriteAnimator.js"></script>
<script src="js/game.js"></script>
```

---

## 🎮 Cara Menggunakan di Code

### Membuat Instance Animator

```javascript
const config = {
  frameCount: 4,
  framePath: (num) => `assets/sprites/shark-walk-${num}.jpeg`,
  animationSpeed: 0.1, // 0.05 = lambat, 0.3 = cepat
  startX: 50,
  startY: 150,
  width: 150,
  height: 150,
  direction: 1, // 1 = kanan, -1 = kiri
  speed: 3, // 1-10 pixel per frame
};

const animator = new SpriteAnimator("gameCanvas", config);
```

### Kontrol Animasi

```javascript
// Play
animator.play();

// Pause
animator.pause();

// Stop & Reset
animator.stop();

// Change speed
animator.setAnimationSpeed(0.15);

// Change movement speed
animator.setMovementSpeed(5);

// Change direction
animator.setDirection(-1);
```

### Event Handling

```javascript
// Ketika frame selesai loading
animator.on("framesLoaded", () => {
  console.log("Siap dijalankan!");
});

// Ketika animasi mulai
animator.on("animationStart", () => {
  console.log("Animasi dimulai");
});

// Ketika shark bounce di tepi
animator.on("bounce", () => {
  console.log("Shark bounce!");
});

// Setiap loop animasi
animator.on("animationLoop", () => {
  console.log("Loop ke-1");
});
```

---

## 📊 Asset Details

### Gambar Shark

| File              | Size        | Status    |
| ----------------- | ----------- | --------- |
| shark-walk-1.jpeg | 6.9 KB      | ✅ Loaded |
| shark-walk-2.jpeg | 7.0 KB      | ✅ Loaded |
| shark-walk-3.jpeg | 6.4 KB      | ✅ Loaded |
| shark-walk-4.jpeg | 7.0 KB      | ✅ Loaded |
| **Total**         | **27.3 KB** | ✅ Ready  |

### Properties

- **Animation Frames:** 4 frames
- **Default Speed:** 0.1 (10% per frame)
- **Canvas Size:** 800x400 px
- **Sprite Size:** 150x150 px
- **Format:** JPEG
- **Background:** Ocean gradient dengan bubble effects

---

## ⚙️ Konfigurasi Advanced

### SpriteAnimator Constructor

```javascript
new SpriteAnimator(canvasId, spriteConfig);
```

**Parameters:**

- `canvasId` (string) - ID canvas element
- `spriteConfig` (object) - Konfigurasi sprite

**spriteConfig Properties:**

- `frameCount` (number) - Jumlah frame
- `framePath` (function) - Path template: `(frameNum) => path`
- `animationSpeed` (number) - 0.05-0.5 (recommend: 0.1)
- `startX` (number) - Posisi X awal
- `startY` (number) - Posisi Y awal
- `width` (number) - Lebar sprite px
- `height` (number) - Tinggi sprite px
- `direction` (number) - 1 (kanan) atau -1 (kiri)
- `speed` (number) - Kecepatan gerakan (1-10)
- `debug` (boolean) - Tampilkan debug info

---

## 🔧 Troubleshooting

### ❌ Gambar tidak muncul

**Solusi:**

1. Cek path di `framePath` - pastikan relative path benar
2. Buka DevTools (F12) → Console tab
3. Lihat error message
4. Pastikan file ada di `assets/sprites/`

```javascript
// Benar ✅
framePath: (num) => `assets/sprites/shark-walk-${num}.jpeg`;

// Salah ❌
framePath: (num) => `sprites/shark-walk-${num}.jpeg`;
```

### ❌ Animasi tidak smooth

**Solusi:**

1. Kurangi `animationSpeed`: `0.08` atau `0.07`
2. Kurangi `speed` movement
3. Reduce canvas resolution

### ❌ Sprite terpotong

**Solusi:**

1. Adjust `width` dan `height` sesuai ukuran gambar
2. Adjust `startY` dan `startX` position
3. Reduce sprite size

---

## 📚 Dokumentasi Lengkap

Lihat file `SPRITE-SYSTEM.md` untuk:

- API Reference lengkap
- Custom implementation
- Advanced usage examples
- Performance tips

---

## ✨ Features yang Tersedia

### Animasi

- ✅ Frame-by-frame animation
- ✅ Smooth transitions
- ✅ Auto-flip saat berubah arah
- ✅ Bounce effect di tepi canvas

### Kontrol

- ✅ Play/Pause/Stop
- ✅ Keyboard controls
- ✅ Button controls
- ✅ Adjust speed real-time

### Rendering

- ✅ Ocean gradient background
- ✅ Bubble particle effects
- ✅ Real-time frame counter
- ✅ Position tracking
- ✅ Debug mode (optional)

### Responsif

- ✅ Mobile friendly
- ✅ Responsive canvas sizing
- ✅ Touch support

---

## 🎯 Next Steps

### Untuk Mengembangkan Lebih Lanjut:

1. **Tambah Animasi Lain**
   - Shark idle animation
   - Attack animation
   - Death animation

2. **Game Logic**
   - Add collision detection
   - Add scoring system
   - Add sound effects

3. **UI Improvements**
   - Add pause menu
   - Add settings panel
   - Add leaderboard

4. **Performance**
   - Optimize sprite loading
   - Add sprite caching
   - Implement LOD system

---

## 📞 Support

Jika ada pertanyaan atau issue:

1. Cek console (F12) untuk error
2. Lihat dokumentasi di `SPRITE-SYSTEM.md`
3. Check `config/sprites.json` untuk konfigurasi

---

## 📝 Version Info

- **Version:** 1.0.0
- **Created:** April 27, 2026
- **Last Updated:** April 27, 2026
- **Status:** ✅ Production Ready

---

**🎮 Siap bermain dengan Angry Sharks! Selamat mencoba! 🦈**
