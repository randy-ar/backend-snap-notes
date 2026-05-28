import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RingkasanResponseDto } from './dto/ringkasan-response.dto';
import { QueryDashboardDto } from './dto/query-dashboard.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getRingkasan(
    penggunaId: string,
    query: QueryDashboardDto,
  ): Promise<RingkasanResponseDto> {
    const now = new Date();
    const bulan = query.bulan ? parseInt(query.bulan, 10) : now.getMonth() + 1;
    const tahun = query.tahun ? parseInt(query.tahun, 10) : now.getFullYear();

    // Buat range tanggal untuk filter
    const startDate = new Date(tahun, bulan - 1, 1);
    const endDate = new Date(tahun, bulan, 0, 23, 59, 59, 999);

    this.logger.debug(
      `Menghitung ringkasan untuk pengguna ${penggunaId} periode ${bulan}/${tahun} (${startDate.toISOString()} - ${endDate.toISOString()})`,
    );

    // Hitung total pemasukan
    const aggregasiPemasukan = await this.prisma.pemasukan.aggregate({
      _sum: {
        jumlah: true,
      },
      where: {
        penggunaId,
        tanggal: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Hitung total pengeluaran
    const aggregasiPengeluaran = await this.prisma.pengeluaran.aggregate({
      _sum: {
        jumlah: true,
      },
      where: {
        penggunaId,
        tanggal: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalPemasukan = aggregasiPemasukan._sum.jumlah ? Number(aggregasiPemasukan._sum.jumlah) : 0;
    const totalPengeluaran = aggregasiPengeluaran._sum.jumlah ? Number(aggregasiPengeluaran._sum.jumlah) : 0;
    const saldo = totalPemasukan - totalPengeluaran;

    return {
      totalPemasukan,
      totalPengeluaran,
      saldo,
    };
  }
}
