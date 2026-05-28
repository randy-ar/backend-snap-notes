import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PemasukanResponseDto {
  @ApiProperty({ description: 'ID pemasukan' })
  id: string;

  @ApiProperty({ description: 'ID pengguna' })
  penggunaId: string;

  @ApiPropertyOptional({ description: 'ID kategori' })
  kategoriId?: string;

  @ApiPropertyOptional({ description: 'Nama kategori' })
  kategoriNama?: string;

  @ApiProperty({ description: 'Deskripsi pemasukan' })
  deskripsi: string;

  @ApiProperty({ description: 'Jumlah pemasukan' })
  jumlah: number;

  @ApiProperty({ description: 'Tanggal pemasukan' })
  tanggal: Date;

  @ApiPropertyOptional({ description: 'Catatan tambahan' })
  catatan?: string;

  @ApiProperty({ description: 'Tanggal dibuat' })
  createdAt: Date;

  @ApiProperty({ description: 'Tanggal diupdate' })
  updatedAt: Date;
}
