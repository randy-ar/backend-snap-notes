import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePemasukanDto } from './dto/create-pemasukan.dto';
import { UpdatePemasukanDto } from './dto/update-pemasukan.dto';
import { QueryPemasukanDto } from './dto/query-pemasukan.dto';
import { PemasukanResponseDto } from './dto/pemasukan-response.dto';

@Injectable()
export class PemasukanService {
  constructor(private readonly prisma: PrismaService) {}

  async tambah(penggunaId: string, dto: CreatePemasukanDto): Promise<PemasukanResponseDto> {
    const pemasukan = await this.prisma.pemasukan.create({
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
      id: pemasukan.id,
      penggunaId: pemasukan.penggunaId,
      
      kategoriId: pemasukan.kategoriId ?? undefined,
      kategoriNama: pemasukan.kategori?.nama,
      deskripsi: pemasukan.deskripsi,
      jumlah: Number(pemasukan.jumlah),
      tanggal: pemasukan.tanggal,
      catatan: pemasukan.catatan ?? undefined,
      createdAt: pemasukan.createdAt,
      updatedAt: pemasukan.updatedAt,
    };
  }

  async getDaftar(penggunaId: string, query: QueryPemasukanDto): Promise<PemasukanResponseDto[]> {
    const where: any = { penggunaId };

    if (query.bulan && query.tahun) {
      const startDate = new Date(Date.UTC(query.tahun, query.bulan - 1, 1, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(query.tahun, query.bulan, 0, 23, 59, 59, 999));
      where.tanggal = {
        gte: startDate,
        lte: endDate,
      };
    }

    const pemasukans = await this.prisma.pemasukan.findMany({
      where,
      include: {
        kategori: true,
      },
      orderBy: { tanggal: 'desc' },
    });

    return pemasukans.map(p => this.mapToResponseDto(p));
  }

  async getDetail(penggunaId: string, id: string): Promise<PemasukanResponseDto> {
    const pemasukan = await this.prisma.pemasukan.findUnique({
      where: { id },
      include: {
        kategori: true,
      },
    });

    if (!pemasukan) {
      throw new NotFoundException('Pemasukan tidak ditemukan');
    }

    if (pemasukan.penggunaId !== penggunaId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke pemasukan ini');
    }

    return this.mapToResponseDto(pemasukan);
  }

  async update(penggunaId: string, id: string, dto: UpdatePemasukanDto): Promise<PemasukanResponseDto> {
    const existing = await this.prisma.pemasukan.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Pemasukan tidak ditemukan');
    }

    if (existing.penggunaId !== penggunaId) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk mengubah pemasukan ini');
    }

    const updated = await this.prisma.pemasukan.update({
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
    const existing = await this.prisma.pemasukan.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Pemasukan tidak ditemukan');
    }

    if (existing.penggunaId !== penggunaId) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk menghapus pemasukan ini');
    }

    await this.prisma.pemasukan.delete({
      where: { id },
    });
  }

  private mapToResponseDto(pemasukan: any): PemasukanResponseDto {
    return {
      id: pemasukan.id,
      penggunaId: pemasukan.penggunaId,
      
      kategoriId: pemasukan.kategoriId ?? undefined,
      kategoriNama: pemasukan.kategori?.nama,
      deskripsi: pemasukan.deskripsi,
      jumlah: Number(pemasukan.jumlah),
      tanggal: pemasukan.tanggal,
      catatan: pemasukan.catatan ?? undefined,
      createdAt: pemasukan.createdAt,
      updatedAt: pemasukan.updatedAt,

    };
  }
}
