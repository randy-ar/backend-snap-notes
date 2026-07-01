import { Injectable, NotFoundException, ForbiddenException, UnprocessableEntityException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LLMFactory } from '../common/llm/llm.factory';
import { ParsedStrukDto } from '../common/llm/llm-provider.interface';
import { StorageService } from '../common/storage/storage.service';
import { ScanStrukDto, OcrDataDto } from './dto/scan-struk.dto';
import { ReparseStrukDto } from './dto/reparse-struk.dto';
import { UpdateStrukDto } from './dto/update-struk.dto';
import { StrukResponseDto, ItemStrukResponseDto } from './dto/struk-response.dto';

@Injectable()
export class StrukService {
  constructor(
    private prisma: PrismaService,
    private llmFactory: LLMFactory,
    private storageService: StorageService,
  ) {}

  async scanStruk(penggunaId: string, file: Express.Multer.File | undefined, dto: ScanStrukDto): Promise<StrukResponseDto> {
    const startTime = Date.now();

    // Pastikan pengguna ada di database (fallback untuk auth via Google/external)
    const pengguna = await this.prisma.pengguna.findUnique({
      where: { id: penggunaId },
    });

    if (!pengguna) {
      throw new NotFoundException('Data pengguna tidak ditemukan. Silakan login ulang.');
    }

    // Parse ocrData dari string JSON
    let ocrData: OcrDataDto;
    try {
      ocrData = JSON.parse(dto.ocrData) as OcrDataDto;
    } catch {
      throw new UnprocessableEntityException('Format ocrData JSON tidak valid');
    }

    // Validasi struktur dasar
    if (!ocrData.rawText || !Array.isArray(ocrData.lines)) {
      throw new UnprocessableEntityException('Struktur ocrData tidak lengkap (rawText dan lines wajib ada)');
    }

    let parsedData: ParsedStrukDto;
    const llmProvider = this.llmFactory.getProvider();

    try {
      const kategoriContext = await this.getKategoriContext(penggunaId);
      parsedData = await llmProvider.parseStrukOCR(
        ocrData.rawText,
        ocrData.lines,
        ocrData.imageSize,
        ocrData.customPrompt,
        kategoriContext
      );
    } catch (error) {
      if (error instanceof ServiceUnavailableException || error instanceof UnprocessableEntityException) {
        throw error;
      }
      throw new ServiceUnavailableException('Gagal memproses struk dengan AI');
    }

    let storageResult: { path: string; publicUrl: string } | null = null;

    if (file) {
      try {
        storageResult = await this.storageService.uploadGambarStruk(file.buffer, file.originalname, penggunaId);
      } catch (error) {
        console.error('Error uploading image to Supabase:', error);
        throw new ServiceUnavailableException(`Gagal mengupload gambar struk: ${error.message}`);
      }
    }

    // Resolusi kategori untuk setiap item struk dan tentukan kategori utama struk
    const resolvedItems: {
      nama: string;
      jumlah: number;
      hargaSatuan: number;
      subtotal: number;
      kategoriId: string | null;
    }[] = [];
    const subtotalPerKategori: Record<string, number> = {};

    for (const item of parsedData.item) {
      let itemKategoriId: string | null = null;

      if (item.kategori) {
        const itemKategori = await this.prisma.kategori.findFirst({
          where: {
            OR: [
              { nama: { contains: item.kategori, mode: 'insensitive' }, adalahPreset: true },
              { nama: { contains: item.kategori, mode: 'insensitive' }, penggunaId },
            ],
          },
        });
        itemKategoriId = itemKategori?.id || null;
      }

      const subtotal = item.subtotal || (item.jumlah * item.harga_satuan);
      if (itemKategoriId) {
        subtotalPerKategori[itemKategoriId] = (subtotalPerKategori[itemKategoriId] || 0) + subtotal;
      }

      resolvedItems.push({
        nama: item.nama,
        jumlah: item.jumlah,
        hargaSatuan: item.harga_satuan,
        subtotal,
        kategoriId: itemKategoriId,
      });
    }

    // Cari kategori item yang dominan (subtotal terbesar)
    let dominanKategoriId: string | null = null;
    let maxSubtotal = -1;
    for (const [catId, subtotal] of Object.entries(subtotalPerKategori)) {
      if (subtotal > maxSubtotal) {
        maxSubtotal = subtotal;
        dominanKategoriId = catId;
      }
    }

    let kategoriId: string | null = dominanKategoriId;

    // Fallback 1: Jika tidak ada kategori item, gunakan kategori_toko
    if (!kategoriId && parsedData.kategori_toko) {
      const kategoriToko = await this.prisma.kategori.findFirst({
        where: {
          OR: [
            { nama: { contains: parsedData.kategori_toko, mode: 'insensitive' }, adalahPreset: true },
            { nama: { contains: parsedData.kategori_toko, mode: 'insensitive' }, penggunaId },
          ],
        },
      });
      kategoriId = kategoriToko?.id || null;
    }

    // Fallback 2: Jika masih null, gunakan kategori 'Lainnya' (PENGELUARAN)
    if (!kategoriId) {
      const kategoriLainnya = await this.prisma.kategori.findFirst({
        where: {
          nama: 'Lainnya',
          jenis: 'PENGELUARAN',
          adalahPreset: true,
        },
      });
      kategoriId = kategoriLainnya?.id || null;
    }

    const struk = await this.prisma.$transaction(async (tx) => {
      const createdStruk = await tx.struk.create({
        data: {
          penggunaId,
          kategoriId,
          namaToko: parsedData.nama_toko,
          tanggalBelanja: new Date(parsedData.tanggal),
          total: parsedData.total,
          gambarUrl: storageResult?.publicUrl || null,
          gambarStoragePath: storageResult?.path || null,
          rawTextOcr: dto.ocrData,
          sudahDikonfirmasi: false,
        },
        include: {
          kategori: true,
        },
      });

      const items = await Promise.all(
        resolvedItems.map(resolvedItem => 
          tx.itemStruk.create({
            data: {
              strukId: createdStruk.id,
              kategoriId: resolvedItem.kategoriId,
              namaItem: resolvedItem.nama,
              jumlah: resolvedItem.jumlah,
              hargaSatuan: resolvedItem.hargaSatuan,
              subtotal: resolvedItem.subtotal,
            },
            include: {
              kategori: true,
            },
          })
        )
      );

      await tx.pengeluaran.create({
        data: {
          penggunaId,
          strukId: createdStruk.id,
          kategoriId,
          deskripsi: `Pembelian di ${parsedData.nama_toko}`,
          jumlah: parsedData.total,
          tanggal: new Date(parsedData.tanggal),
        },
      });

      return { ...createdStruk, itemStruks: items };
    }, { timeout: 15000 });

    const endTime = Date.now();
    console.log(`[scanStruk] Completed in ${endTime - startTime}ms for penggunaId: ${penggunaId}`);

    return this.mapToResponseDto(struk);
  }

  async reparseStruk(penggunaId: string, id: string, dto: ReparseStrukDto): Promise<StrukResponseDto> {
    const startTime = Date.now();

    const existingStruk = await this.prisma.struk.findUnique({
      where: { id },
    });

    if (!existingStruk) {
      throw new NotFoundException('Struk tidak ditemukan');
    }

    if (existingStruk.penggunaId !== penggunaId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke struk ini');
    }

    if (!existingStruk.rawTextOcr) {
      throw new UnprocessableEntityException('Data OCR tidak tersedia untuk struk ini');
    }

    let ocrData: OcrDataDto;
    try {
      ocrData = JSON.parse(existingStruk.rawTextOcr) as OcrDataDto;
    } catch {
      throw new UnprocessableEntityException('Format ocrData JSON tidak valid pada struk yang ada');
    }

    let parsedData: ParsedStrukDto;
    const llmProvider = this.llmFactory.getProvider();

    try {
      const kategoriContext = await this.getKategoriContext(penggunaId);
      parsedData = await llmProvider.parseStrukOCR(
        ocrData.rawText,
        ocrData.lines,
        ocrData.imageSize,
        dto.prompt,
        kategoriContext
      );
    } catch (error) {
      if (error instanceof ServiceUnavailableException || error instanceof UnprocessableEntityException) {
        throw error;
      }
      throw new ServiceUnavailableException('Gagal memproses ulang struk dengan AI');
    }

    // Resolusi kategori untuk setiap item struk dan tentukan kategori utama struk
    const resolvedItems: {
      nama: string;
      jumlah: number;
      hargaSatuan: number;
      subtotal: number;
      kategoriId: string | null;
    }[] = [];
    const subtotalPerKategori: Record<string, number> = {};

    for (const item of parsedData.item) {
      let itemKategoriId: string | null = null;

      if (item.kategori) {
        const itemKategori = await this.prisma.kategori.findFirst({
          where: {
            OR: [
              { nama: { contains: item.kategori, mode: 'insensitive' }, adalahPreset: true },
              { nama: { contains: item.kategori, mode: 'insensitive' }, penggunaId },
            ],
          },
        });
        itemKategoriId = itemKategori?.id || null;
      }

      const subtotal = item.subtotal || (item.jumlah * item.harga_satuan);
      if (itemKategoriId) {
        subtotalPerKategori[itemKategoriId] = (subtotalPerKategori[itemKategoriId] || 0) + subtotal;
      }

      resolvedItems.push({
        nama: item.nama,
        jumlah: item.jumlah,
        hargaSatuan: item.harga_satuan,
        subtotal,
        kategoriId: itemKategoriId,
      });
    }

    // Cari kategori item yang dominan (subtotal terbesar)
    let dominanKategoriId: string | null = null;
    let maxSubtotal = -1;
    for (const [catId, subtotal] of Object.entries(subtotalPerKategori)) {
      if (subtotal > maxSubtotal) {
        maxSubtotal = subtotal;
        dominanKategoriId = catId;
      }
    }

    let kategoriId: string | null = dominanKategoriId;

    // Fallback 1: Jika tidak ada kategori item, gunakan kategori_toko
    if (!kategoriId && parsedData.kategori_toko) {
      const kategoriToko = await this.prisma.kategori.findFirst({
        where: {
          OR: [
            { nama: { contains: parsedData.kategori_toko, mode: 'insensitive' }, adalahPreset: true },
            { nama: { contains: parsedData.kategori_toko, mode: 'insensitive' }, penggunaId },
          ],
        },
      });
      kategoriId = kategoriToko?.id || null;
    }

    // Fallback 2: Jika masih null, gunakan kategori 'Lainnya' (PENGELUARAN)
    if (!kategoriId) {
      const kategoriLainnya = await this.prisma.kategori.findFirst({
        where: {
          nama: 'Lainnya',
          jenis: 'PENGELUARAN',
          adalahPreset: true,
        },
      });
      kategoriId = kategoriLainnya?.id || null;
    }

    const updatedStruk = await this.prisma.$transaction(async (tx) => {
      // Delete existing itemStruks
      await tx.itemStruk.deleteMany({
        where: { strukId: id },
      });

      // Update Struk
      const strukResult = await tx.struk.update({
        where: { id },
        data: {
          kategoriId,
          namaToko: parsedData.nama_toko,
          tanggalBelanja: new Date(parsedData.tanggal),
          total: parsedData.total,
        },
        include: {
          kategori: true,
        },
      });

      const items = await Promise.all(
        resolvedItems.map(resolvedItem => 
          tx.itemStruk.create({
            data: {
              strukId: id,
              kategoriId: resolvedItem.kategoriId,
              namaItem: resolvedItem.nama,
              jumlah: resolvedItem.jumlah,
              hargaSatuan: resolvedItem.hargaSatuan,
              subtotal: resolvedItem.subtotal,
            },
            include: {
              kategori: true,
            },
          })
        )
      );

      // Update Pengeluaran
      await tx.pengeluaran.updateMany({
        where: { strukId: id },
        data: {
          kategoriId,
          deskripsi: `Pembelian di ${parsedData.nama_toko}`,
          jumlah: parsedData.total,
          tanggal: new Date(parsedData.tanggal),
        },
      });

      return { ...strukResult, itemStruks: items };
    }, { timeout: 15000 });

    const endTime = Date.now();
    console.log(`[reparseStruk] Completed in ${endTime - startTime}ms for penggunaId: ${penggunaId}, strukId: ${id}`);

    return this.mapToResponseDto(updatedStruk);
  }

  async getDaftarStruk(penggunaId: string, query?: { bulan?: number; tahun?: number }): Promise<StrukResponseDto[]> {
    const where: { penggunaId: string; tanggalBelanja?: { gte: Date; lte: Date } } = { penggunaId };

    if (query?.bulan && query?.tahun) {
      const startDate = new Date(query.tahun, query.bulan - 1, 1);
      const endDate = new Date(query.tahun, query.bulan, 0);
      where.tanggalBelanja = {
        gte: startDate,
        lte: endDate,
      };
    }

    const struks = await this.prisma.struk.findMany({
      where,
      include: {
        kategori: true,
        itemStruks: {
          include: {
            kategori: true,
          },
        },
      },
      orderBy: { tanggalBelanja: 'desc' },
    });

    return struks.map((struk) => this.mapToResponseDto(struk));
  }

  async getDetailStruk(penggunaId: string, id: string): Promise<StrukResponseDto> {
    const struk = await this.prisma.struk.findUnique({
      where: { id },
      include: {
        kategori: true,
        itemStruks: {
          include: {
            kategori: true,
          },
        },
      },
    });

    if (!struk) {
      throw new NotFoundException('Struk tidak ditemukan');
    }

    if (struk.penggunaId !== penggunaId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke struk ini');
    }

    return this.mapToResponseDto(struk);
  }

  async updateStruk(penggunaId: string, id: string, dto: UpdateStrukDto): Promise<StrukResponseDto> {
    const existingStruk = await this.prisma.struk.findUnique({
      where: { id },
    });

    if (!existingStruk) {
      throw new NotFoundException('Struk tidak ditemukan');
    }

    if (existingStruk.penggunaId !== penggunaId) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk mengubah struk ini');
    }

    const updatedStruk = await this.prisma.struk.update({
      where: { id },
      data: {
        kategoriId: dto.kategoriId,
        namaToko: dto.namaToko,
        tanggalBelanja: dto.tanggalBelanja ? new Date(dto.tanggalBelanja) : undefined,
        total: dto.total,
      },
      include: {
        kategori: true,
        itemStruks: {
          include: {
            kategori: true,
          },
        },
      },
    });

    if (dto.total) {
      await this.prisma.pengeluaran.updateMany({
        where: { strukId: id },
        data: { jumlah: dto.total },
      });
    }

    return this.mapToResponseDto(updatedStruk);
  }

  async hapusStruk(penggunaId: string, id: string): Promise<void> {
    const existingStruk = await this.prisma.struk.findUnique({
      where: { id },
    });

    if (!existingStruk) {
      throw new NotFoundException('Struk tidak ditemukan');
    }

    if (existingStruk.penggunaId !== penggunaId) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk menghapus struk ini');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.pengeluaran.deleteMany({
        where: { strukId: id },
      });

      await tx.itemStruk.deleteMany({
        where: { strukId: id },
      });

      await tx.struk.delete({
        where: { id },
      });
    });

    if (existingStruk.gambarStoragePath) {
      try {
        await this.storageService.hapusGambar(existingStruk.gambarStoragePath);
      } catch {
      }
    }
  }

  async konfirmasiStruk(penggunaId: string, id: string): Promise<StrukResponseDto> {
    const existingStruk = await this.prisma.struk.findUnique({
      where: { id },
    });

    if (!existingStruk) {
      throw new NotFoundException('Struk tidak ditemukan');
    }

    if (existingStruk.penggunaId !== penggunaId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke struk ini');
    }

    const updatedStruk = await this.prisma.struk.update({
      where: { id },
      data: { sudahDikonfirmasi: true },
      include: {
        kategori: true,
        itemStruks: {
          include: {
            kategori: true,
          },
        },
      },
    });

    return this.mapToResponseDto(updatedStruk);
  }

  private mapToResponseDto(struk: any): StrukResponseDto {
    return {
      id: struk.id,
      penggunaId: struk.penggunaId,
      kategoriId: struk.kategoriId || undefined,
      kategoriNama: struk.kategori?.nama || undefined,
      namaToko: struk.namaToko,
      tanggalBelanja: struk.tanggalBelanja,
      total: Number(struk.total),
      gambarUrl: struk.gambarUrl || undefined,
      sudahDikonfirmasi: struk.sudahDikonfirmasi,
      items: struk.itemStruks?.map((item: any): ItemStrukResponseDto => ({
        id: item.id,
        namaItem: item.namaItem,
        jumlah: item.jumlah,
        hargaSatuan: Number(item.hargaSatuan),
        subtotal: Number(item.subtotal),
        kategoriId: item.kategoriId || undefined,
        kategoriNama: item.kategori?.nama || undefined,
      })) || [],
      createdAt: struk.createdAt,
      updatedAt: struk.updatedAt,
    };
  }

  private async getKategoriContext(penggunaId: string): Promise<string> {
    const kategoris = await this.prisma.kategori.findMany({
      where: {
        OR: [
          { adalahPreset: true },
          { penggunaId },
        ],
      },
      orderBy: {
        jenis: 'asc',
      },
    });

    const presetDescriptions: Record<string, string> = {
      'Makanan': 'Makan berat, restoran, warteg, jajan',
      'Minuman': 'Kopi, boba, kafe, air mineral',
      'Sembako': 'Beras, telur, minyak goreng, bumbu, kebutuhan dapur',
      'Transportasi': 'Bensin, parkir, tiket travel/kereta, ojol',
      'Komunikasi': 'Pulsa fisik, voucher internet, warnet',
      'Edukasi': 'Alat tulis, fotokopi, buku, print',
      'Perawatan': 'Skincare, kosmetik, sabun, salon',
      'Pakaian': 'Baju, celana, sepatu, tas, aksesoris',
      'Hiburan': 'Tiket bioskop, tempat bermain, karaoke',
      'Kesehatan': 'Apotek, obat-obatan, vitamin, klinik',
      'Elektronik': 'Aksesoris HP, kabel, servis laptop, gadget',
      'Otomotif': 'Bengkel, ganti oli, cuci motor/mobil, sparepart',
      'Lainnya': 'Pengeluaran/Pemasukan lain yang tak terduga',
      'Saku': 'Uang jatah bulanan/mingguan dari orang tua',
      'Gaji': 'Hasil part-time, pekerjaan tetap, upah',
      'Beasiswa': 'Pencairan dana beasiswa',
      'Bonus': 'Uang kaget, hadiah, THR, cashback besar',
      'Bisnis': 'Hasil jualan barang/jasa, keuntungan dagang',
      'Transfer': 'Mutasi antar rekening, top-up e-wallet',
      'Utang': 'Meminjam uang dari orang lain/institusi',
      'Piutang': 'Meminjamkan uang ke orang lain',
    };

    const lines = kategoris.map(k => {
      let desc = '';
      if (k.adalahPreset && presetDescriptions[k.nama]) {
        desc = ` - ${presetDescriptions[k.nama]}`;
      } else if (!k.adalahPreset) {
        desc = ` - (Kategori kustom user)`;
      }
      return `- ${k.nama} [Tipe: ${k.jenis}]${desc}`;
    });

    return lines.join('\n');
  }
}
