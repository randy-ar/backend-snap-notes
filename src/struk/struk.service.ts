import { Injectable, NotFoundException, ForbiddenException, UnprocessableEntityException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService, ParsedStrukDto } from '../common/gemini/gemini.service';
import { StorageService } from '../common/storage/storage.service';
import { ScanStrukDto } from './dto/scan-struk.dto';
import { UpdateStrukDto } from './dto/update-struk.dto';
import { StrukResponseDto, ItemStrukResponseDto } from './dto/struk-response.dto';

@Injectable()
export class StrukService {
  constructor(
    private prisma: PrismaService,
    private geminiService: GeminiService,
    private storageService: StorageService,
  ) {}

  async scanStruk(penggunaId: string, file: Express.Multer.File | undefined, dto: ScanStrukDto): Promise<StrukResponseDto> {
    let parsedData: ParsedStrukDto;
    
    try {
      parsedData = await this.geminiService.parseStrukOCR(dto.rawText);
    } catch (error) {
      if (error instanceof ServiceUnavailableException || error instanceof UnprocessableEntityException) {
        throw error;
      }
      throw new ServiceUnavailableException('Gagal memproses struk dengan AI');
    }

    let storageResult: { path: string; publicUrl: string } | null = null;
    
    if (file) {
      try {
        storageResult = await this.storageService.uploadGambarStruk(file.buffer, file.originalname);
      } catch (error) {
        throw new ServiceUnavailableException('Gagal mengupload gambar struk');
      }
    }

    let kategoriId: string | null = null;
    if (parsedData.kategori_toko) {
      const kategori = await this.prisma.kategori.findFirst({
        where: {
          OR: [
            { nama: { contains: parsedData.kategori_toko, mode: 'insensitive' }, adalahPreset: true },
            { nama: { contains: parsedData.kategori_toko, mode: 'insensitive' }, penggunaId },
          ],
        },
      });
      kategoriId = kategori?.id || null;
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
          rawTextOcr: dto.rawText,
          sudahDikonfirmasi: false,
        },
        include: {
          kategori: true,
        },
      });

      const itemPromises = parsedData.item.map(async (item) => {
        let itemKategoriId: string | null = null;
        if (item.kategori) {
          const itemKategori = await tx.kategori.findFirst({
            where: {
              OR: [
                { nama: { contains: item.kategori, mode: 'insensitive' }, adalahPreset: true },
                { nama: { contains: item.kategori, mode: 'insensitive' }, penggunaId },
              ],
            },
          });
          itemKategoriId = itemKategori?.id || null;
        }

        return tx.itemStruk.create({
          data: {
            strukId: createdStruk.id,
            kategoriId: itemKategoriId,
            namaItem: item.nama,
            jumlah: item.jumlah,
            hargaSatuan: item.harga_satuan,
            subtotal: item.subtotal || item.jumlah * item.harga_satuan,
          },
          include: {
            kategori: true,
          },
        });
      });

      const items = await Promise.all(itemPromises);

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
    });

    return this.mapToResponseDto(struk);
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
}
