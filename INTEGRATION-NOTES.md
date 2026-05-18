# 🦈 Shark Animation Integration - Catatan Perubahan

## 📝 Ringkasan

Karakter shark di game utama `index.html` (DeepFeed - Shark Survival) telah diubah dari canvas shape drawing menjadi animated sprite yang menggunakan gambar shark-walk berjalan.

---

## 🔄 Perubahan yang Dilakukan

### **File: `script.js`**

#### 1. **Asset Loading** (Line 61-76)

```javascript
let sharkFrames = [];
let sharkFrameIndex = 0;
let sharkFrameTimer = 0;
const SHARK_FRAME_SPEED = 0.15;

async function loadSharkFrames() {
  for (let i = 1; i <= 4; i++) {
    const img = new Image();
    img.src = `assets/sprites/shark-walk-${i}.jpeg`;
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
    });
    sharkFrames.push(img);
  }
  console.log(`🦈 Loaded ${sharkFrames.length} shark frames`);
}
loadSharkFrames();
```

**Apa yang dilakukan:**

- Load 4 gambar shark berjalan dari `assets/sprites/`
- Simpan di array `sharkFrames`
- Setup frame animation counter
- Automatic loading saat script start

#### 2. **Modified drawPlayer Function** (Line 915-953)

```javascript
function drawPlayer(t) {
  // ... setup code ...

  // Update frame animation
  sharkFrameTimer += SHARK_FRAME_SPEED;
  if (sharkFrameTimer >= 1) {
    sharkFrameTimer -= 1;
    sharkFrameIndex = (sharkFrameIndex + 1) % Math.max(1, sharkFrames.length);
  }

  // Draw shark animation frame
  if (sharkFrames.length > 0) {
    const frame = sharkFrames[sharkFrameIndex];
    if (frame && frame.complete) {
      const imgRatio = frame.naturalWidth / frame.naturalHeight;
      const drawW = pr * 2.8 * imgRatio;
      const drawH = pr * 2.8;
      ctx.globalAlpha = 0.85 + player.eatAnim * 0.15;
      ctx.drawImage(frame, -drawW / 2, -drawH / 2, drawW, drawH);
    } else {
      drawSharkShape(ctx, pr, t);
    }
  } else {
    drawSharkShape(ctx, pr, t);
  }
}
```

**Apa yang dilakukan:**

- Animate melalui 4 frame gambar shark berjalan
- Render gambar ke canvas dengan `ctx.drawImage()`
- Fallback ke canvas shape jika image gagal load
- Maintain kompatibilitas dengan player scale dan rotation

---

## ✨ Features

✅ **Smooth Animation** - 4 frame walking animation dengan smooth transitions  
✅ **Responsive Scaling** - Shark size mengikuti game playerSize  
✅ **Smart Flipping** - Gambar flip otomatis saat ubah arah  
✅ **Fallback Mode** - Kembali ke shape drawing jika image gagal  
✅ **Performance** - Efficient frame cycling tanpa lag

---

## 🎮 Cara Test

### Opsi 1: Direct Open

```
File Explorer → index.html
Double-click atau drag to browser
```

### Opsi 2: Local Server

```bash
# Windows (PowerShell)
python -m http.server 8000
# or
npx http-server

# Buka: http://localhost:8000
```

### Opsi 3: Live Server (VS Code)

- Install extension "Live Server"
- Right-click `index.html` → "Open with Live Server"

---

## 🔧 Customization

### Ubah Kecepatan Animasi

Di `script.js` line 64:

```javascript
const SHARK_FRAME_SPEED = 0.15; // 0.1 = lebih lambat, 0.3 = lebih cepat
```

### Ubah Ukuran Shark

Di `script.js` line 943:

```javascript
const drawW = pr * 2.8 * imgRatio; // 2.8 = scale factor
const drawH = pr * 2.8;
```

Increase nilai untuk shark lebih besar, decrease untuk lebih kecil.

### Tambah Frame Baru

1. Taruh gambar di `assets/sprites/shark-walk-5.jpeg`
2. Di `loadSharkFrames()`, ubah:
   ```javascript
   for (let i = 1; i <= 5; i++) {  // Ubah 4 ke 5
   ```

---

## 🐛 Troubleshooting

### ❌ Shark tidak muncul (blank canvas)

**Solusi:**

1. Buka browser DevTools (F12)
2. Lihat console tab untuk errors
3. Check bahwa gambar path benar: `assets/sprites/shark-walk-*.jpeg`
4. Pastikan file ada dan readable

### ❌ Animasi tidak smooth

**Solusi:**

1. Reduce `SHARK_FRAME_SPEED` dari 0.15 ke 0.1
2. Check system performance (other apps running)
3. Try di browser berbeda

### ❌ Gambar loading lambat

**Solusi:**

1. Compress JPEG image (reduce size)
2. Use JPEG quality 75-85%
3. Resize ke dimensi yang lebih kecil jika perlu

---

## 📊 Asset Information

| File              | Size        | Status   |
| ----------------- | ----------- | -------- |
| shark-walk-1.jpeg | 6.9 KB      | ✅       |
| shark-walk-2.jpeg | 7.0 KB      | ✅       |
| shark-walk-3.jpeg | 6.4 KB      | ✅       |
| shark-walk-4.jpeg | 7.0 KB      | ✅       |
| **Total**         | **27.3 KB** | ✅ Ready |

---

## 🎯 Next Steps (Optional)

1. **Add More Animations**
   - shark-idle-\*.jpeg
   - shark-attack-\*.jpeg
   - shark-dead-\*.jpeg

2. **Particle Effects**
   - Add bubbles saat shark bergerak
   - Add trail effect

3. **Sound Effects**
   - Shark eating sound
   - Swimming sound

4. **Optimization**
   - Cache loaded frames
   - Preload images
   - Lazy load animation

---

## 📝 Version History

**v1.0** - April 27, 2026

- Initial shark animation integration
- 4-frame walking animation
- Fallback to canvas shape drawing

---

**Game siap dimainkan dengan shark animasi baru! 🦈🎮**
