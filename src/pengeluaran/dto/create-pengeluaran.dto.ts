import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class CreatePengeluaranDto {
  @ApiProperty({ description: 'Deskripsi pengeluaran', example: 'Makan siang' })
  @IsString()
  @IsNotEmpty()
  deskripsi: string;

  @ApiProperty({ description: 'Jumlah pengeluaran', example: 25000 })
  @IsNumber()
  @IsNotEmpty()
  jumlah: number;

  @ApiProperty({ description: 'Tanggal pengeluaran (ISO 8601)', example: '2026-05-28T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  tanggal: string;

  @ApiPropertyOptional({ description: 'ID kategori' })
  @IsUUID()
  @IsOptional()
  kategoriId?: string;

  @ApiPropertyOptional({ description: 'Catatan tambahan' })
  @IsString()
  @IsOptional()
  catatan?: string;
}
