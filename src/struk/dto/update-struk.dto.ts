import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsNumber, IsUUID } from 'class-validator';

export class UpdateStrukDto {
  @ApiPropertyOptional({ description: 'ID kategori toko' })
  @IsOptional()
  @IsUUID(undefined, { message: 'ID kategori tidak valid' })
  kategoriId?: string;

  @ApiPropertyOptional({ description: 'Nama toko/merchant' })
  @IsOptional()
  @IsString()
  namaToko?: string;

  @ApiPropertyOptional({ description: 'Tanggal belanja (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString({}, { message: 'Format tanggal tidak valid' })
  tanggalBelanja?: string;

  @ApiPropertyOptional({ description: 'Total keseluruhan struk' })
  @IsOptional()
  @IsNumber({}, { message: 'Total harus berupa angka' })
  total?: number;
}
