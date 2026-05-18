# ⚡ Quick Setup Guide - Angry Sharks Sprite System

## 🎯 Apa yang Sudah Selesai

✅ **Rename Files** - Gambar di-rename ke `shark-walk-1.jpeg` sampai `shark-walk-4.jpeg`  
✅ **Organize Assets** - Folder struktur terorganisir (sprites, backgrounds, sounds, ui)  
✅ **Sprite System** - Core animation engine (`SpriteAnimator.js`)  
✅ **Game Controller** - Game logic dan kontrol (`game.js`)  
✅ **Demo Page** - `shark-demo.html` siap dijalankan  
✅ **Styling** - Beautiful UI dengan `sprite-animator.css`  
✅ **Documentation** - Lengkap dengan tutorial dan API reference

---

## 🚀 Langkah 1: Jalankan Demo

**Opsi A - Direct Open:**

```
File Explorer → Angry Sharks folder
Double-click: shark-demo.html
```

**Opsi B - Browser:**

```
1. Open browser (Chrome, Firefox, Edge)
2. Ctrl+O (atau File → Open)
3. Pilih: shark-demo.html
```

---

## 🎮 Langkah 2: Test Animasi

### Mouse Controls

- ▶ **Mulai** - Jalankan animasi
- ⏸ **Pause** - Jeda
- ↻ **Reset** - Reset

### Keyboard

- **SPACE** - Play/Pause
- **R** - Reset
- **← →** - Ubah arah

---

## 🔧 Langkah 3: Integrate ke Game Utama

Di file `index.html` Anda, tambahkan kode ini sebelum `</body>`:

```html
<!-- Sprite Animation System -->
<script src="js/SpriteAnimator.js"></script>
<script src="js/game.js"></script>
```

---

## 📁 Folder Structure

```
assets/
├── sprites/              ← Sprite gambar (shark-walk-*.jpeg)
├── backgrounds/          ← Untuk background ke depan
├── sounds/               ← Untuk audio ke depan
└── ui/                   ← Untuk UI elements ke depan

js/
├── SpriteAnimator.js     ← Core engine
└── game.js               ← Game controller

css/
└── sprite-animator.css   ← Styling
```

---

## 💡 Contoh Penggunaan

### Simple Usage

```javascript
// 1. Create config
const config = {
  frameCount: 4,
  framePath: (num) => `assets/sprites/shark-walk-${num}.jpeg`,
  animationSpeed: 0.1,
};

// 2. Create animator
const animator = new SpriteAnimator("gameCanvas", config);

// 3. Play
animator.play();
```

### Advanced Usage

```javascript
// Listen to events
animator.on("framesLoaded", () => {
  console.log("Siap dijalankan!");
});

animator.on("bounce", () => {
  console.log("Shark bounce!");
});

// Change properties
animator.setAnimationSpeed(0.15);
animator.setMovementSpeed(5);
animator.setDirection(-1);
```

---

## ❓ FAQ

### Q: Di mana letak file sprite?

**A:** `assets/sprites/shark-walk-1.jpeg` hingga `shark-walk-4.jpeg`

### Q: Bagaimana cara menambah animasi baru?

**A:**

1. Taruh gambar di `assets/sprites/`
2. Update config `frameCount` dan `framePath`
3. Rerun animasi

### Q: Bagaimana kalau gambar tidak muncul?

**A:**

1. Cek path di `framePath` - pastikan benar
2. Buka DevTools (F12) → Console
3. Lihat error message

### Q: Bisa di-optimize?

**A:**

1. Reduce image size (compress JPEG)
2. Change `animationSpeed` (min: 0.05, max: 0.5)
3. Reduce canvas resolution

---

## 📖 Dokumentasi Lengkap

Untuk info lebih detail, buka:

- `README-SPRITE-SYSTEM.md` - Overview lengkap
- `SPRITE-SYSTEM.md` - API reference & advanced

---

## 📊 File Summary

| File                    | Purpose         | Size  |
| ----------------------- | --------------- | ----- |
| shark-demo.html         | Demo page       | -     |
| js/SpriteAnimator.js    | Core engine     | ~10KB |
| js/game.js              | Game controller | ~5KB  |
| css/sprite-animator.css | Styling         | ~3KB  |
| config/sprites.json     | Configuration   | ~1KB  |
| assets/sprites/\*.jpeg  | Sprite images   | 27KB  |

**Total:** ~46KB (tanpa dependency eksternal)

---

## ✅ Checklist

- [x] Gambar di-rename
- [x] Folder terorganisir
- [x] Sprite system dibuat
- [x] Game controller dibuat
- [x] Demo page siap
- [x] Styling selesai
- [x] Dokumentasi lengkap
- [x] Ready to production!

---

**Silakan buka `shark-demo.html` dan nikmati animasi shark berjalan! 🦈**
