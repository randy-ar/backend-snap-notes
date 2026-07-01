import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JenisKategori } from '@prisma/client';

export class KategoriResponseDto {
  @ApiProperty({ description: 'ID kategori' })
  id: string;

  @ApiPropertyOptional({ description: 'ID pengguna (null jika preset)' })
  penggunaId?: string;

  @ApiProperty({ description: 'Nama kategori' })
  nama: string;

  @ApiProperty({ description: 'Jenis kategori', enum: JenisKategori })
  jenis: JenisKategori;

  @ApiProperty({ description: 'Apakah kategori bawaan sistem' })
  adalahPreset: boolean;

  @ApiProperty({ description: 'Tanggal dibuat' })
  createdAt: Date;

  @ApiProperty({ description: 'Tanggal diupdate' })
  updatedAt: Date;
}
