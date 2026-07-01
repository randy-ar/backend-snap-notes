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

  async getDaftar(penggunaId: string, query: QueryPengeluaranDto): Promise<any> {
    const where: any = { penggunaId };

    if (query.bulan && query.tahun) {
      const startDate = new Date(Date.UTC(query.tahun, query.bulan - 1, 1, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(query.tahun, query.bulan, 0, 23, 59, 59, 999));
      where.tanggal = {
        gte: startDate,
        lte: endDate,
      };
    }

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const [pengeluarans, total] = await Promise.all([
      this.prisma.pengeluaran.findMany({
        where,
        include: {
          kategori: true,
        },
        orderBy: { tanggal: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.pengeluaran.count({ where }),
    ]);

    return {
      data: pengeluarans.map(p => this.mapToResponseDto(p)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOverview(penggunaId: string, query: QueryPengeluaranDto): Promise<any> {
    const now = new Date();
    const bulan = query.bulan ? Number(query.bulan) : now.getMonth() + 1;
    const tahun = query.tahun ? Number(query.tahun) : now.getFullYear();

    const currStartDate = new Date(Date.UTC(tahun, bulan - 1, 1, 0, 0, 0, 0));
    const currEndDate = new Date(Date.UTC(tahun, bulan, 0, 23, 59, 59, 999));

    let prevBulan = bulan - 1;
    let prevTahun = tahun;
    if (prevBulan === 0) {
      prevBulan = 12;
      prevTahun -= 1;
    }
    const prevStartDate = new Date(Date.UTC(prevTahun, prevBulan - 1, 1, 0, 0, 0, 0));
    const prevEndDate = new Date(Date.UTC(prevTahun, prevBulan, 0, 23, 59, 59, 999));

    const [currAgg, prevAgg] = await Promise.all([
      this.prisma.pengeluaran.aggregate({
        _sum: { jumlah: true },
        where: { penggunaId, tanggal: { gte: currStartDate, lte: currEndDate } },
      }),
      this.prisma.pengeluaran.aggregate({
        _sum: { jumlah: true },
        where: { penggunaId, tanggal: { gte: prevStartDate, lte: prevEndDate } },
      }),
    ]);

    const totalCurrentMonth = currAgg._sum.jumlah ? Number(currAgg._sum.jumlah) : 0;
    const totalPreviousMonth = prevAgg._sum.jumlah ? Number(prevAgg._sum.jumlah) : 0;
    let percentageChange = 0;

    if (totalPreviousMonth > 0) {
      percentageChange = ((totalCurrentMonth - totalPreviousMonth) / totalPreviousMonth) * 100;
    } else if (totalCurrentMonth > 0) {
      percentageChange = 100;
    }

    return {
      totalCurrentMonth,
      totalPreviousMonth,
      percentageChange,
      isTrendingGood: percentageChange <= 0,
    };
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
      strukId: pengeluaran.strukId ?? null,
      kategoriId: pengeluaran.kategoriId ?? null,
      kategoriNama: pengeluaran.kategori?.nama ?? null,
      kategori: pengeluaran.kategori ? {
        id: pengeluaran.kategori.id,
        nama: pengeluaran.kategori.nama,
        jenis: pengeluaran.kategori.jenis,
        icon: pengeluaran.kategori.icon,
      } : null,
      deskripsi: pengeluaran.deskripsi,
      jumlah: Number(pengeluaran.jumlah),
      tanggal: pengeluaran.tanggal,
      catatan: pengeluaran.catatan ?? null,
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
          kategoriId: item.kategoriId ?? null,
          kategoriNama: item.kategori?.nama ?? null,
        })) || [],
      } : null,
    };
  }
}
