import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePengeluaranDto } from './dto/create-pengeluaran.dto';
import { UpdatePengeluaranDto } from './dto/update-pengeluaran.dto';
import { QueryPengeluaranDto } from './dto/query-pengeluaran.dto';
import { PengeluaranResponseDto } from './dto/pengeluaran-response.dto';

@Injectable()
export class PengeluaranService {
  constructor(private readonly prisma: PrismaService) {}

  async tambah(penggunaId: string, dto: CreatePengeluaranDto): Promise<PengeluaranResponseDto> {
    const pengeluaran = await this.prisma.pengeluaran.create({
      data: {
        penggunaId,
        deskripsi: dto.deskripsi,
        jumlah: dto.jumlah,
        tanggal: new Date(dto.tanggal),
        kategoriId: dto.kategoriId,
        catatan: dto.catatan,
      },
      include: {
        kategori: true,
      },
    });

    return {
      id: pengeluaran.id,
      penggunaId: pengeluaran.penggunaId,
      strukId: pengeluaran.strukId ?? undefined,
      kategoriId: pengeluaran.kategoriId ?? undefined,
      kategoriNama: pengeluaran.kategori?.nama,
      deskripsi: pengeluaran.deskripsi,
      jumlah: Number(pengeluaran.jumlah),
      tanggal: pengeluaran.tanggal,
      catatan: pengeluaran.catatan ?? undefined,
      createdAt: pengeluaran.createdAt,
      updatedAt: pengeluaran.updatedAt,
    };
  }

  async getDaftar(penggunaId: string, query: QueryPengeluaranDto): Promise<PengeluaranResponseDto[]> {
    const where: any = { penggunaId };

    if (query.bulan && query.tahun) {
      const startDate = new Date(query.tahun, query.bulan - 1, 1);
      const endDate = new Date(query.tahun, query.bulan, 0);
      where.tanggal = {
        gte: startDate,
        lte: endDate,
      };
    }

    const pengeluarans = await this.prisma.pengeluaran.findMany({
      where,
      include: {
        kategori: true,
      },
      orderBy: { tanggal: 'desc' },
    });

    return pengeluarans.map(p => this.mapToResponseDto(p));
  }

  async getDetail(penggunaId: string, id: string): Promise<PengeluaranResponseDto> {
    const pengeluaran = await this.prisma.pengeluaran.findUnique({
      where: { id },
      include: {
        kategori: true,
        struk: {
          include: {
            itemStruks: {
              include: {
                kategori: true,
              },
            },
          },
        },
      },
    });

    if (!pengeluaran) {
      throw new NotFoundException('Pengeluaran tidak ditemukan');
    }

    if (pengeluaran.penggunaId !== penggunaId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke pengeluaran ini');
    }

    return this.mapToResponseDto(pengeluaran);
  }

  async update(penggunaId: string, id: string, dto: UpdatePengeluaranDto): Promise<PengeluaranResponseDto> {
    const existing = await this.prisma.pengeluaran.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Pengeluaran tidak ditemukan');
    }

    if (existing.penggunaId !== penggunaId) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk mengubah pengeluaran ini');
    }

    const updated = await this.prisma.pengeluaran.update({
      where: { id },
      data: {
        deskripsi: dto.deskripsi,
        jumlah: dto.jumlah,
        tanggal: dto.tanggal ? new Date(dto.tanggal) : undefined,
        kategoriId: dto.kategoriId,
        catatan: dto.catatan,
      },
      include: {
        kategori: true,
      },
    });

    return this.mapToResponseDto(updated);
  }

  async hapus(penggunaId: string, id: string): Promise<void> {
    const existing = await this.prisma.pengeluaran.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Pengeluaran tidak ditemukan');
    }

    if (existing.penggunaId !== penggunaId) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk menghapus pengeluaran ini');
    }

    await this.prisma.pengeluaran.delete({
      where: { id },
    });
  }

  private mapToResponseDto(pengeluaran: any): PengeluaranResponseDto {
    return {
      id: pengeluaran.id,
      penggunaId: pengeluaran.penggunaId,
      strukId: pengeluaran.strukId ?? undefined,
      kategoriId: pengeluaran.kategoriId ?? undefined,
      kategoriNama: pengeluaran.kategori?.nama,
      deskripsi: pengeluaran.deskripsi,
      jumlah: Number(pengeluaran.jumlah),
      tanggal: pengeluaran.tanggal,
      catatan: pengeluaran.catatan ?? undefined,
      createdAt: pengeluaran.createdAt,
      updatedAt: pengeluaran.updatedAt,
      struk: pengeluaran.struk ? {
        id: pengeluaran.struk.id,
        namaToko: pengeluaran.struk.namaToko,
        tanggalBelanja: pengeluaran.struk.tanggalBelanja,
        total: Number(pengeluaran.struk.total),
        gambarUrl: pengeluaran.struk.gambarUrl,
        items: pengeluaran.struk.itemStruks?.map((item: any) => ({
          id: item.id,
          namaItem: item.namaItem,
          jumlah: item.jumlah,
          hargaSatuan: Number(item.hargaSatuan),
          subtotal: Number(item.subtotal),
          kategoriId: item.kategoriId ?? undefined,
          kategoriNama: item.kategori?.nama ?? undefined,
        })) || [],
      } : undefined,
    };
  }
}
