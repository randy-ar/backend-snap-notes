import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class QueryDashboardDto {
  @ApiPropertyOptional({
    description: 'Filter berdasarkan bulan (1-12). Jika tidak diisi, menggunakan bulan berjalan.',
    example: '5',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(1[0-2]|[1-9])$/, { message: 'Bulan harus antara 1 dan 12' })
  bulan?: string;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan tahun (contoh: 2026). Jika tidak diisi, menggunakan tahun berjalan.',
    example: '2026',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}$/, { message: 'Tahun harus 4 digit' })
  tahun?: string;
}
