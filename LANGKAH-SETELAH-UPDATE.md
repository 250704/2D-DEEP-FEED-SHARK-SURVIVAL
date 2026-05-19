# Langkah yang harus Anda lakukan setelah ada perubahan kode

Dokumen ini untuk sinkron **Cursor / VS Code** ↔ **Git** ↔ **GitHub** ↔ **gim di browser**.

---

## 1. Ambil perubahan terbaru dari GitHub ke laptop

Di folder proyek (misalnya `Angry Sharks`), buka terminal **Git Bash** atau terminal di Cursor:

```bash
git checkout main
git pull origin main
```

- **`git pull`** = mengganti file di laptop dengan versi terbaru di GitHub (termasuk `script.js`, `index.html`, dll.).

Setelah itu, **refresh keras** di browser (**Ctrl + Shift + R**) supaya `script.js` tidak diambil dari cache lama.

---

## 2. Kalau Anda sendiri yang mengubah kode lalu ingin mengirim ke GitHub

```bash
git status
git add script.js
git commit -m "Jelaskan singkat perubahan, mis: tambah musik latar"
git push origin main
```

- **`git add`** = pilih file yang ikut commit.  
- **`git commit`** = rekam perubahan di laptop dengan pesan.  
- **`git push`** = unggah commit itu ke GitHub.

*(Kalau tim Anda pakai **branch** + **Pull Request**, ganti `main` dengan nama branch fitur dan buka PR di situs GitHub.)*

---

## 3. Kalau Git menolak `pull` (error merge / file berubah lokal)

Artinya ada edit di laptop yang belum di-commit dan bentrok dengan GitHub.

- **Simpan sementara lalu pull:**

  ```bash
  git stash push -m "simpan"
  git pull origin main
  git stash pop
  ```

- **Atau** buang edit lokal dan ikuti GitHub (hati-hati, hilang permanen):

  ```bash
  git checkout -- script.js
  git pull origin main
  ```

---

## 4. Menjalankan gim setelah update

1. Buka folder proyek di **Cursor** atau **VS Code** (sama saja untuk file).  
2. Jalankan lewat **http://** (mis. **Live Server** atau `npx serve .`) jika bisa — lebih stabil untuk audio daripada `file://`.  
3. Buka **`index.html`**, ketuk **MULAI** — suara efek dan **musik latar** baru diizinkan browser setelah ketukan itu.

---

## Ringkas

| Anda ingin…              | Perintah / tindakan utama      |
|-------------------------|---------------------------------|
| Ambil kode dari GitHub  | `git pull origin main`         |
| Kirim kode ke GitHub    | `git add` → `commit` → `push` |
| Lihat apa yang berubah  | `git status`                   |

Setiap kali ada update dari tim atau dari Cursor Agent, ulangi **bagian 1** supaya laptop Anda selalu sama dengan GitHub.
