# Product Requirements Document (PRD)
# Snap Notes — Aplikasi Pencatat Pengeluaran dari Struk Belanja

**Versi:** 1.0.0  
**Tanggal:** Mei 2026  
**Status:** Draft

---

## 1. Ringkasan Eksekutif

Snap Notes adalah aplikasi mobile berbasis Flutter yang membantu masyarakat mencatat pengeluaran secara efisien melalui pemindaian struk belanja menggunakan OCR dan kecerdasan buatan (Gemini AI). Aplikasi ini dilengkapi dengan fitur notifikasi pengingat yang dipersonalisasi dan dashboard laporan keuangan bulanan untuk memberikan gambaran yang jelas mengenai pola pengeluaran pengguna.

---

## 2. Latar Belakang & Problem Statement

### 2.1 Latar Belakang

Pengelolaan keuangan pribadi merupakan hal penting namun sering diabaikan oleh masyarakat umum. Salah satu hambatan utama adalah proses pencatatan pengeluaran yang dianggap merepotkan dan tidak praktis. Struk belanja yang diterima setelah berbelanja sering kali hanya disimpan sebentar lalu dibuang, tanpa pernah dicatat ke dalam pembukuan keuangan.

### 2.2 Problem Statements

| # | Masalah | Dampak |
|---|---------|--------|
| PS-01 | **Masyarakat sering lupa mencatat struk belanja ke pembukuan** | Pengeluaran tidak terdokumentasi, kehilangan jejak keuangan |
| PS-02 | **Masyarakat malas mencatat data dari struk belanja karena dirasa kurang efisien** | Pencatatan manual memakan waktu dan rentan kesalahan input |
| PS-03 | **Masyarakat kurang mendapatkan informasi/overview yang jelas terkait laporan pengeluaran bulanan** | Sulit membuat keputusan keuangan berdasarkan data historis |

---

## 3. Tujuan Produk

| Tujuan | Indikator Keberhasilan |
|--------|----------------------|
| Meningkatkan konsistensi pencatatan pengeluaran | ≥ 70% pengguna aktif mencatat minimal 3x per minggu |
| Mempercepat proses pencatatan via scan struk | Waktu pencatatan < 30 detik per struk |
| Memberikan insight laporan keuangan yang mudah dipahami | ≥ 80% pengguna mengakses dashboard minimal 1x per minggu |

---

## 4. Target Pengguna

**Segmen Utama:** Masyarakat Indonesia usia 18–40 tahun yang aktif berbelanja dan ingin mengelola keuangan pribadi namun tidak memiliki cukup waktu atau kedisiplinan untuk mencatat secara manual.

**Karakteristik Pengguna:**
- Pengguna smartphone (Android/iOS)
- Berbelanja di minimarket, supermarket, atau toko ritel
- Memiliki kesadaran untuk mengelola keuangan namun kurang konsisten
- Tidak berpengalaman dengan aplikasi akuntansi kompleks

---

## 5. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│                   Aplikasi Flutter (Mobile)                     │
│         Android / iOS — Google ML Kit OCR                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS / REST API
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SERVER LAYER                             │
│              NestJS (TypeScript) — Deploy Vercel                │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────────────┐  │
│  │ Auth Module │  │ Struk Module│  │  Dashboard Module      │  │
│  │             │  │ (OCR+AI)    │  │                        │  │
│  └─────────────┘  └─────────────┘  └────────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────────────┐  │
│  │Pengeluaran  │  │ Pemasukan   │  │  Notifikasi Module     │  │
│  │  Module     │  │  Module     │  │  (Preferensi)          │  │
│  └─────────────┘  └─────────────┘  └────────────────────────┘  │
│                        Prisma ORM                               │
└──────────┬─────────────────┬──────────────────┬────────────────┘
           │                 │                  │
           ▼                 ▼                  ▼
┌──────────────┐  ┌──────────────────┐  ┌─────────────────┐
│ Supabase Auth│  │ Supabase Database│  │Supabase Storage │
│              │  │  (PostgreSQL)    │  │ (Gambar Struk)  │
└──────────────┘  └──────────────────┘  └─────────────────┘
                                                │
                                    ┌───────────▼──────────┐
                                    │   Google Gemini AI   │
                                    │   (Parsing OCR→JSON) │
                                    └──────────────────────┘
```

### 5.1 Komponen Teknologi

| Komponen | Teknologi | Keterangan |
|----------|-----------|------------|
| Mobile Client | Flutter (Dart) | Android & iOS |
| OCR Engine | Google ML Kit | Ekstraksi teks dari gambar struk di sisi client |
| Backend Server | NestJS (TypeScript) | REST API, deploy ke Vercel |
| AI Parsing | Google Gemini AI API | Parsing hasil OCR → struktur JSON |
| Database | PostgreSQL via Supabase | Data pengguna, transaksi, preferensi |
| ORM | Prisma | Query database dari NestJS |
| Auth | Supabase Auth | Email/Password |
| Storage | Supabase Storage | Penyimpanan gambar struk belanja |
| Deployment Server | Vercel | Serverless deployment NestJS |
| API Documentation | Swagger (OpenAPI 3.0) via `@nestjs/swagger` | Dokumentasi REST API interaktif |
| Unit Testing | Jest + `@nestjs/testing` | Unit test service layer dan integrasi modul |

---

## 6. Fitur Utama

### 6.1 Fitur 1 — Notifikasi Pengingat Terpersonalisasi (Mengatasi PS-01)

**Deskripsi:**  
Pengguna dapat mengatur waktu pengingat harian untuk mencatat pengeluaran. Preferensi waktu notifikasi bersifat personal karena setiap pengguna memiliki waktu luang yang berbeda-beda.

**Alur Pengguna:**
1. Pengguna membuka halaman pengaturan notifikasi
2. Pengguna memilih hari dan jam pengingat (misal: Setiap hari pukul 21.00)
3. Pengaturan dikirim dan disimpan ke server
4. Notifikasi tampil di device sesuai jadwal yang ditetapkan

**Ketentuan:**
- Pengguna dapat mengatur lebih dari satu jadwal notifikasi
- Pengguna dapat mengaktifkan/menonaktifkan notifikasi kapan saja
- Server menyimpan preferensi; mekanisme pengiriman notifikasi (FCM/local) ditentukan pada fase implementasi

**Data yang disimpan:**
- ID pengguna
- Hari-hari aktif notifikasi (array)
- Jam notifikasi
- Status aktif/nonaktif

---

### 6.2 Fitur 2 — Scan Struk Belanja dengan OCR + Gemini AI (Mengatasi PS-02)

**Deskripsi:**  
Pengguna dapat memotret atau memilih gambar struk belanja. Google ML Kit mengekstraksi teks dari gambar (OCR) di sisi client Flutter. Hasil teks dikirim ke server NestJS beserta gambar struk, kemudian server membangun prompt dan mengirimkannya ke Gemini AI untuk diparse menjadi data JSON terstruktur.

**Alur Pengguna:**
1. Pengguna menekan tombol "Scan Struk"
2. Pengguna mengambil foto atau memilih gambar dari galeri
3. Google ML Kit memproses gambar → menghasilkan raw text
4. Flutter mengirim raw text + gambar ke server NestJS
5. Server menyimpan gambar ke Supabase Storage
6. Server membuat prompt dari raw text dan mengirim ke Gemini AI
7. Gemini AI mengembalikan JSON terstruktur (nama toko, tanggal, daftar item, total)
8. Server menyimpan data ke database dan mengembalikan hasil ke client
9. Pengguna dapat meninjau, mengedit, dan mengkonfirmasi data sebelum disimpan

**Format JSON Output Gemini AI:**
```json
{
  "nama_toko": "Indomaret Jl. Merdeka",
  "tanggal": "2026-05-07",
  "total": 85000,
  "kategori_toko": "Makanan & Minuman",
  "item": [
    {
      "nama": "Indomie Goreng",
      "jumlah": 3,
      "harga_satuan": 3500,
      "subtotal": 10500,
      "kategori": "Makanan"
    }
  ]
}
```

**Kategori:**
- Sistem menyediakan kategori preset (Makanan & Minuman, Transportasi, Kesehatan, Pendidikan, Hiburan, Rumah Tangga, Pakaian, Lainnya)
- Pengguna dapat membuat kategori custom
- Gemini AI akan mengenali dan memetakan kategori dari item struk secara otomatis

**Data yang disimpan:**
- Data struk (header): nama toko, tanggal, total, kategori toko, URL gambar
- Data item struk: nama item, jumlah, harga satuan, subtotal, kategori item

---

### 6.3 Fitur 3 — Dashboard Laporan Pengeluaran (Mengatasi PS-03)

**Deskripsi:**  
Pengguna dapat melihat ringkasan keuangan melalui dashboard yang menampilkan calendar view dan line chart perbandingan pengeluaran vs pemasukan bulanan.

**Komponen Dashboard:**

| Komponen | Deskripsi |
|----------|-----------|
| **Calendar View** | Menampilkan tanggal-tanggal yang memiliki transaksi; warna indikator berdasarkan total pengeluaran hari itu |
| **Line Chart Bulanan** | Grafik perbandingan total pengeluaran vs pemasukan dari bulan ke bulan |
| **Ringkasan Bulan Ini** | Total pengeluaran, total pemasukan, selisih (saldo) bulan berjalan |
| **Pengeluaran per Kategori** | Breakdown pengeluaran berdasarkan kategori (pie chart / bar chart) |
| **Riwayat Transaksi** | Daftar transaksi terbaru yang dapat difilter berdasarkan tanggal dan kategori |

**Alur Pengguna:**
1. Pengguna membuka halaman Dashboard
2. Sistem mengambil data agregat dari server
3. Dashboard menampilkan calendar view bulan berjalan
4. Pengguna dapat memilih bulan lain untuk melihat data historis
5. Pengguna dapat mengetuk tanggal di calendar untuk melihat transaksi pada hari tersebut
6. Line chart menampilkan tren pengeluaran vs pemasukan 6 bulan terakhir

**API yang diperlukan:**
- `GET /dashboard/ringkasan?bulan=&tahun=` — total pengeluaran, pemasukan, saldo
- `GET /dashboard/kalender?bulan=&tahun=` — data per hari untuk calendar view
- `GET /dashboard/tren?bulan_mulai=&bulan_selesai=` — data bulanan untuk line chart
- `GET /dashboard/kategori?bulan=&tahun=` — breakdown per kategori

---

## 7. Fitur Pendukung

### 7.1 Autentikasi

| Aksi | Endpoint | Keterangan |
|------|----------|------------|
| Daftar | `POST /auth/daftar` | Email, password, nama lengkap |
| Masuk | `POST /auth/masuk` | Email & password via Supabase Auth |
| Keluar | `POST /auth/keluar` | Invalidasi sesi |
| Refresh Token | `POST /auth/refresh` | Perpanjang sesi |
| Profil | `GET /auth/profil` | Data profil pengguna |
| Update Profil | `PATCH /auth/profil` | Update nama, foto profil |

### 7.2 Manajemen Pengeluaran Manual

Selain scan struk, pengguna dapat menambah pengeluaran secara manual (tanpa struk).

| Aksi | Endpoint |
|------|----------|
| Tambah pengeluaran | `POST /pengeluaran` |
| Lihat daftar | `GET /pengeluaran` |
| Detail pengeluaran | `GET /pengeluaran/:id` |
| Edit pengeluaran | `PATCH /pengeluaran/:id` |
| Hapus pengeluaran | `DELETE /pengeluaran/:id` |

### 7.3 Manajemen Pemasukan

Pengguna mencatat pemasukan secara manual.

| Aksi | Endpoint |
|------|----------|
| Tambah pemasukan | `POST /pemasukan` |
| Lihat daftar | `GET /pemasukan` |
| Detail pemasukan | `GET /pemasukan/:id` |
| Edit pemasukan | `PATCH /pemasukan/:id` |
| Hapus pemasukan | `DELETE /pemasukan/:id` |

### 7.4 Manajemen Kategori

| Aksi | Endpoint |
|------|----------|
| Daftar kategori (preset + custom) | `GET /kategori` |
| Tambah kategori custom | `POST /kategori` |
| Edit kategori custom | `PATCH /kategori/:id` |
| Hapus kategori custom | `DELETE /kategori/:id` |

---

## 8. Alur Data Utama

### 8.1 Alur Scan Struk

```
Flutter App
    │
    ├─► Kamera/Galeri → Gambar Struk
    │
    ├─► Google ML Kit OCR → Raw Text
    │
    └─► POST /struk/scan
            {rawText, gambar (multipart)}
                │
                ▼
        NestJS Server
            │
            ├─► Upload gambar → Supabase Storage → dapatkan URL
            │
            ├─► Buat prompt dari rawText
            │
            ├─► POST ke Gemini AI API
            │       └─► Terima JSON terstruktur
            │
            ├─► Simpan Struk + ItemStruk → Supabase DB (via Prisma)
            │
            └─► Return response ke Flutter
                    {struk_id, nama_toko, tanggal, total, items[]}
```

### 8.2 Alur Autentikasi

```
Flutter → POST /auth/masuk {email, password}
    → NestJS → Supabase Auth signInWithPassword()
    → Terima {access_token, refresh_token}
    → Kembalikan token ke Flutter
    → Flutter simpan token (secure storage)
    → Semua request berikutnya: Authorization: Bearer <token>
```

---

## 9. Spesifikasi Non-Fungsional

| Kategori | Ketentuan |
|----------|-----------|
| **Keamanan** | JWT token dari Supabase Auth; semua endpoint dilindungi guard autentikasi |
| **Performa** | Response API < 2 detik (non-AI); proses scan struk < 10 detik |
| **Skalabilitas** | Serverless Vercel + Supabase connection pooling (PgBouncer) |
| **Ketersediaan** | Mengikuti SLA Vercel (99.99%) dan Supabase (99.9%) |
| **Validasi** | Semua input divalidasi di sisi server menggunakan class-validator |
| **Error Handling** | Standard HTTP error codes dengan pesan dalam Bahasa Indonesia |
| **File Upload** | Maksimal ukuran gambar struk: 5 MB; format: JPG, PNG, WEBP |

---

## 10. Batasan & Asumsi

**Batasan:**
- Aplikasi hanya mendukung Bahasa Indonesia untuk parsing struk
- OCR dilakukan di sisi client (Flutter) untuk mengurangi beban server
- Tidak ada fitur multi-currency (hanya Rupiah/IDR)
- Tidak ada fitur sharing/kolaborasi antar pengguna

**Asumsi:**
- Struk belanja memiliki format teks yang dapat dibaca (tidak buram/rusak)
- Pengguna memiliki koneksi internet saat melakukan scan struk
- Gemini AI API tersedia dan menghasilkan output JSON yang valid

---

## 11. Rencana Pengembangan (Milestone)

| Milestone | Deskripsi | Target |
|-----------|-----------|--------|
| M1 | Setup project, autentikasi, Prisma schema | Minggu 1–2 |
| M2 | Modul pengeluaran & pemasukan (CRUD) | Minggu 3–4 |
| M3 | Integrasi Supabase Storage + Gemini AI (scan struk) | Minggu 5–6 |
| M4 | Modul notifikasi (preferensi) | Minggu 7 |
| M5 | Modul dashboard (agregasi data) | Minggu 8–9 |
| M6 | Testing, optimasi, dan deployment Vercel | Minggu 10–11 |

---

## 12. Risiko

| Risiko | Probabilitas | Dampak | Mitigasi |
|--------|-------------|--------|---------|
| Hasil OCR tidak akurat pada struk berkualitas rendah | Tinggi | Sedang | Tambah fitur review/edit sebelum simpan |
| Gemini AI menghasilkan JSON tidak valid | Sedang | Tinggi | Implementasi retry logic + fallback parsing |
| Rate limit Gemini AI API | Rendah | Sedang | Implementasi queue dan error handling graceful |
| Cold start Vercel serverless lambat | Sedang | Rendah | Optimalkan bundle size NestJS |

---

## 13. Dokumentasi API — Swagger / OpenAPI

### 13.1 Deskripsi

Seluruh REST API backend Snap Notes didokumentasikan menggunakan **Swagger (OpenAPI 3.0)** melalui package `@nestjs/swagger`. Dokumentasi bersifat interaktif sehingga tim frontend (Flutter) maupun pihak lain dapat mengeksplorasi dan mencoba endpoint langsung dari browser.

### 13.2 Konfigurasi

| Properti | Nilai |
|----------|-------|
| Package | `@nestjs/swagger`, `swagger-ui-express` |
| URL Akses (development) | `http://localhost:3000/api/docs` |
| URL Akses (production) | `https://<vercel-domain>/api/docs` |
| Format | OpenAPI 3.0 JSON (`/api/docs-json`) |
| Auth di Swagger | Bearer Token (JWT dari Supabase Auth) |

### 13.3 Konvensi Dekorasi

Setiap modul menggunakan dekorator `@nestjs/swagger` secara konsisten:

| Dekorator | Penggunaan |
|-----------|------------|
| `@ApiTags('nama-modul')` | Mengelompokkan endpoint per modul di UI Swagger |
| `@ApiOperation({ summary })` | Deskripsi singkat tiap endpoint |
| `@ApiResponse({ status, description, type })` | Mendokumentasikan semua kemungkinan response |
| `@ApiBearerAuth()` | Menandai endpoint yang memerlukan JWT token |
| `@ApiBody({ type: DtoClass })` | Mendokumentasikan request body |
| `@ApiQuery({ name, required, type })` | Mendokumentasikan query parameter |
| `@ApiParam({ name, type })` | Mendokumentasikan path parameter |
| `@ApiProperty()` / `@ApiPropertyOptional()` | Mendokumentasikan field pada DTO |
| `@ApiConsumes('multipart/form-data')` | Untuk endpoint upload gambar struk |

### 13.4 Grouping Endpoint per Tag

| Tag | Modul | Jumlah Endpoint |
|-----|-------|-----------------|
| `auth` | Autentikasi | 6 |
| `struk` | Scan & manajemen struk | 5 |
| `pengeluaran` | Manajemen pengeluaran | 5 |
| `pemasukan` | Manajemen pemasukan | 5 |
| `kategori` | Manajemen kategori | 4 |
| `notifikasi` | Preferensi notifikasi | 3 |
| `dashboard` | Laporan & statistik | 4 |

### 13.5 Keamanan Swagger di Production

- Swagger UI hanya diaktifkan pada environment `development` dan `staging`
- Di environment `production` (Vercel), Swagger UI dapat dinonaktifkan atau dilindungi dengan Basic Auth tambahan
- Konfigurasi dikontrol via environment variable `SWAGGER_ENABLED=true|false`

---

## 14. Strategi Unit Testing

### 14.1 Framework & Tools

| Tool | Peran |
|------|-------|
| **Jest** | Test runner utama (sudah include di NestJS) |
| **`@nestjs/testing`** | `TestingModule` untuk bootstrap modul NestJS secara terisolasi |
| **`jest.fn()` / `jest.spyOn()`** | Mocking dependency (Prisma, Gemini, Storage, Supabase) |
| **Supertest** | HTTP integration test untuk controller (end-to-end layer) |

### 14.2 Strategi & Pertimbangan

Pendekatan yang digunakan adalah **unit test pada layer Service** sebagai prioritas utama, karena:
- Logic bisnis (kalkulasi, transformasi data, error handling) ada di Service
- Controller hanya mendelegasikan ke Service — cukup dengan integration test
- Dependency eksternal (Prisma, Gemini AI, Supabase) di-**mock** seluruhnya agar test tidak bergantung pada koneksi jaringan atau database

### 14.3 Cakupan Unit Test per Modul

#### `AuthService`
| Test Case | Skenario |
|-----------|----------|
| `daftar()` berhasil | Supabase Auth signUp() berhasil, data pengguna tersimpan |
| `daftar()` email sudah terdaftar | Supabase Auth mengembalikan error, throw `ConflictException` |
| `masuk()` berhasil | Kredensial valid, token JWT dikembalikan |
| `masuk()` kredensial salah | Throw `UnauthorizedException` |
| `getProfil()` berhasil | Mengembalikan data profil pengguna |

#### `StrukService`
| Test Case | Skenario |
|-----------|----------|
| `scanStruk()` berhasil | Gambar diupload, Gemini parsing berhasil, struk & item tersimpan |
| `scanStruk()` Gemini gagal | Gemini AI error → throw `ServiceUnavailableException` |
| `scanStruk()` JSON Gemini tidak valid | Fallback / throw `UnprocessableEntityException` |
| `getDetailStruk()` berhasil | Struk ditemukan dan dikembalikan |
| `getDetailStruk()` tidak ditemukan | Throw `NotFoundException` |
| `hapusStruk()` berhasil | Struk & gambar di storage dihapus |
| `hapusStruk()` bukan milik pengguna | Throw `ForbiddenException` |

#### `GeminiService`
| Test Case | Skenario |
|-----------|----------|
| `parseStrukOCR()` output valid | Raw text → JSON terstruktur yang benar |
| `parseStrukOCR()` response tidak valid JSON | Throw error / kembalikan null |
| `buatPrompt()` | Prompt mengandung raw text dan instruksi format yang benar |

#### `PengeluaranService`
| Test Case | Skenario |
|-----------|----------|
| `tambah()` berhasil | Data pengeluaran tersimpan dengan benar |
| `getDaftar()` berhasil | Mengembalikan list pengeluaran milik pengguna |
| `getDetail()` tidak ditemukan | Throw `NotFoundException` |
| `update()` bukan milik pengguna | Throw `ForbiddenException` |
| `hapus()` berhasil | Data terhapus dari database |

#### `PemasukanService`
| Test Case | Skenario |
|-----------|----------|
| `tambah()` berhasil | Data pemasukan tersimpan dengan benar |
| `getDaftar()` berhasil | Mengembalikan list pemasukan milik pengguna |
| `getDetail()` tidak ditemukan | Throw `NotFoundException` |
| `update()` bukan milik pengguna | Throw `ForbiddenException` |
| `hapus()` berhasil | Data terhapus dari database |

#### `KategoriService`
| Test Case | Skenario |
|-----------|----------|
| `getDaftar()` berhasil | Mengembalikan kategori preset + kategori custom milik pengguna |
| `tambah()` berhasil | Kategori custom tersimpan dengan `adalahPreset = false` |
| `hapus()` kategori preset | Throw `ForbiddenException` (preset tidak bisa dihapus) |
| `hapus()` kategori milik pengguna lain | Throw `ForbiddenException` |

#### `NotifikasiService`
| Test Case | Skenario |
|-----------|----------|
| `simpanPreferensi()` berhasil | Preferensi notifikasi tersimpan |
| `updatePreferensi()` nonaktifkan | Field `aktif` diupdate menjadi `false` |
| `getPreferensi()` belum ada data | Mengembalikan data kosong / default |

#### `DashboardService`
| Test Case | Skenario |
|-----------|----------|
| `getRingkasan()` bulan dengan data | Total pengeluaran, pemasukan, dan saldo dihitung dengan benar |
| `getRingkasan()` bulan tanpa data | Semua nilai dikembalikan sebagai 0 |
| `getKalender()` berhasil | Data per hari dikembalikan dengan benar |
| `getTren()` berhasil | Data 6 bulan terakhir terhitung dengan benar |
| `getPerKategori()` berhasil | Breakdown per kategori sesuai data |

### 14.4 Konvensi Penulisan Test

```
src/
├── auth/
│   └── auth.service.spec.ts
├── struk/
│   └── struk.service.spec.ts
├── pengeluaran/
│   └── pengeluaran.service.spec.ts
├── pemasukan/
│   └── pemasukan.service.spec.ts
├── kategori/
│   └── kategori.service.spec.ts
├── notifikasi/
│   └── notifikasi.service.spec.ts
├── dashboard/
│   └── dashboard.service.spec.ts
└── common/
    └── gemini/
        └── gemini.service.spec.ts
```

- Setiap file test menggunakan pola `describe → it/test` yang deskriptif
- Mock Prisma dibuat dengan `jest.fn()` yang mengembalikan data fixture
- Dependency eksternal (Gemini AI, Supabase Auth, Storage) selalu di-mock — tidak ada real network call
- Target coverage: **≥ 80%** pada layer Service

### 14.5 Perintah Testing

```bash
npm run test              # Jalankan semua unit test
npm run test:watch        # Mode watch untuk development
npm run test:cov          # Lihat coverage report
npm run test:e2e          # End-to-end test (opsional)
```

---

*Dokumen ini merupakan landasan pengembangan aplikasi Snap Notes dan akan diperbarui seiring perkembangan proyek.*
