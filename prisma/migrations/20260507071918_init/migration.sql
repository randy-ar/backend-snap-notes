-- CreateEnum
CREATE TYPE "JenisKategori" AS ENUM ('PENGELUARAN', 'PEMASUKAN', 'KEDUANYA');

-- CreateTable
CREATE TABLE "pengguna" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nama_lengkap" TEXT NOT NULL,
    "foto_profil_url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pengguna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preferensi_notifikasi" (
    "id" TEXT NOT NULL,
    "pengguna_id" TEXT NOT NULL,
    "hari_aktif" TEXT[],
    "jam_notifikasi" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preferensi_notifikasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kategori" (
    "id" TEXT NOT NULL,
    "pengguna_id" TEXT,
    "nama" TEXT NOT NULL,
    "jenis" "JenisKategori" NOT NULL DEFAULT 'KEDUANYA',
    "adalah_preset" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kategori_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "struk" (
    "id" TEXT NOT NULL,
    "pengguna_id" TEXT NOT NULL,
    "kategori_id" TEXT,
    "nama_toko" TEXT NOT NULL,
    "tanggal_belanja" DATE NOT NULL,
    "total" DECIMAL(15,2) NOT NULL,
    "gambar_url" TEXT,
    "gambar_storage_path" TEXT,
    "raw_text_ocr" TEXT,
    "sudah_dikonfirmasi" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "struk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_struk" (
    "id" TEXT NOT NULL,
    "struk_id" TEXT NOT NULL,
    "kategori_id" TEXT,
    "nama_item" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "harga_satuan" DECIMAL(15,2) NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_struk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengeluaran" (
    "id" TEXT NOT NULL,
    "pengguna_id" TEXT NOT NULL,
    "struk_id" TEXT,
    "kategori_id" TEXT,
    "deskripsi" TEXT NOT NULL,
    "jumlah" DECIMAL(15,2) NOT NULL,
    "tanggal" DATE NOT NULL,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pengeluaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pemasukan" (
    "id" TEXT NOT NULL,
    "pengguna_id" TEXT NOT NULL,
    "kategori_id" TEXT,
    "deskripsi" TEXT NOT NULL,
    "jumlah" DECIMAL(15,2) NOT NULL,
    "tanggal" DATE NOT NULL,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pemasukan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pengguna_email_key" ON "pengguna"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pengeluaran_struk_id_key" ON "pengeluaran"("struk_id");

-- AddForeignKey
ALTER TABLE "preferensi_notifikasi" ADD CONSTRAINT "preferensi_notifikasi_pengguna_id_fkey" FOREIGN KEY ("pengguna_id") REFERENCES "pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kategori" ADD CONSTRAINT "kategori_pengguna_id_fkey" FOREIGN KEY ("pengguna_id") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "struk" ADD CONSTRAINT "struk_pengguna_id_fkey" FOREIGN KEY ("pengguna_id") REFERENCES "pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "struk" ADD CONSTRAINT "struk_kategori_id_fkey" FOREIGN KEY ("kategori_id") REFERENCES "kategori"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_struk" ADD CONSTRAINT "item_struk_struk_id_fkey" FOREIGN KEY ("struk_id") REFERENCES "struk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_struk" ADD CONSTRAINT "item_struk_kategori_id_fkey" FOREIGN KEY ("kategori_id") REFERENCES "kategori"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengeluaran" ADD CONSTRAINT "pengeluaran_pengguna_id_fkey" FOREIGN KEY ("pengguna_id") REFERENCES "pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengeluaran" ADD CONSTRAINT "pengeluaran_struk_id_fkey" FOREIGN KEY ("struk_id") REFERENCES "struk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengeluaran" ADD CONSTRAINT "pengeluaran_kategori_id_fkey" FOREIGN KEY ("kategori_id") REFERENCES "kategori"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pemasukan" ADD CONSTRAINT "pemasukan_pengguna_id_fkey" FOREIGN KEY ("pengguna_id") REFERENCES "pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pemasukan" ADD CONSTRAINT "pemasukan_kategori_id_fkey" FOREIGN KEY ("kategori_id") REFERENCES "kategori"("id") ON DELETE SET NULL ON UPDATE CASCADE;
