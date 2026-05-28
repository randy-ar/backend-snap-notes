import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PengeluaranResponseDto {
  @ApiProperty({ description: 'ID pengeluaran' })
  id: string;

  @ApiProperty({ description: 'ID pengguna' })
  penggunaId: string;

  @ApiPropertyOptional({ description: 'ID struk terkait (jika ada)' })
  strukId?: string;

  @ApiPropertyOptional({ description: 'ID kategori' })
  kategoriId?: string;

  @ApiPropertyOptional({ description: 'Nama kategori' })
  kategoriNama?: string;

  @ApiProperty({ description: 'Deskripsi pengeluaran' })
  deskripsi: string;

  @ApiProperty({ description: 'Jumlah pengeluaran' })
  jumlah: number;

  @ApiProperty({ description: 'Tanggal pengeluaran' })
  tanggal: Date;

  @ApiPropertyOptional({ description: 'Catatan tambahan' })
  catatan?: string;

  @ApiProperty({ description: 'Tanggal dibuat' })
  createdAt: Date;

  @ApiProperty({ description: 'Tanggal diupdate' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Detail struk terkait (hanya direturn pada detail)' })
  struk?: any;
}
