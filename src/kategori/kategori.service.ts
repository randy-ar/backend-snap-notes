import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KategoriResponseDto } from './dto/kategori-response.dto';
import { JenisKategori } from '@prisma/client';

@Injectable()
export class KategoriService {
  constructor(private readonly prisma: PrismaService) {}

  async getDaftar(penggunaId: string, jenis?: JenisKategori): Promise<KategoriResponseDto[]> {
    const where: any = {
      OR: [
        { adalahPreset: true },
        { penggunaId },
      ],
    };

    if (jenis) {
      where.jenis = { in: [jenis, JenisKategori.KEDUANYA] };
    }

    const kategoris = await this.prisma.kategori.findMany({
      where,
      orderBy: { nama: 'asc' },
    });

    return kategoris.map(k => ({
      id: k.id,
      penggunaId: k.penggunaId ?? undefined,
      nama: k.nama,
      jenis: k.jenis,
      adalahPreset: k.adalahPreset,
      createdAt: k.createdAt,
      updatedAt: k.updatedAt,
    }));
  }
}
