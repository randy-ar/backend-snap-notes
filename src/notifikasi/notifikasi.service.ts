import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PreferensiNotifikasiDto, UpdatePreferensiNotifikasiDto } from './dto/preferensi-notifikasi.dto';

@Injectable()
export class NotifikasiService {
  constructor(private readonly prisma: PrismaService) {}

  async getPreferensiList(penggunaId: string) {
    return this.prisma.preferensiNotifikasi.findMany({
      where: { penggunaId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createPreferensi(penggunaId: string, dto: PreferensiNotifikasiDto) {
    const hariAktif = dto.hariAktif || ['1', '2', '3', '4', '5'];
    const jamNotifikasi = dto.jamNotifikasi || '19:00';
    const aktif = dto.aktif !== undefined ? dto.aktif : true;

    return this.prisma.preferensiNotifikasi.create({
      data: {
        penggunaId,
        hariAktif,
        jamNotifikasi,
        aktif,
      },
    });
  }

  async updatePreferensi(penggunaId: string, id: string, dto: UpdatePreferensiNotifikasiDto) {
    const existing = await this.prisma.preferensiNotifikasi.findUnique({
      where: { id },
    });

    if (!existing || existing.penggunaId !== penggunaId) {
      throw new NotFoundException('Preferensi notifikasi tidak ditemukan');
    }

    return this.prisma.preferensiNotifikasi.update({
      where: { id },
      data: {
        hariAktif: dto.hariAktif !== undefined ? dto.hariAktif : existing.hariAktif,
        jamNotifikasi: dto.jamNotifikasi !== undefined ? dto.jamNotifikasi : existing.jamNotifikasi,
        aktif: dto.aktif !== undefined ? dto.aktif : existing.aktif,
      },
    });
  }

  async deletePreferensi(penggunaId: string, id: string) {
    const existing = await this.prisma.preferensiNotifikasi.findUnique({
      where: { id },
    });

    if (!existing || existing.penggunaId !== penggunaId) {
      throw new NotFoundException('Preferensi notifikasi tidak ditemukan');
    }

    return this.prisma.preferensiNotifikasi.delete({
      where: { id },
    });
  }
}
