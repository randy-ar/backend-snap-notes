import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumberString } from 'class-validator';

export class QueryStrukDto {
  @ApiPropertyOptional({ description: 'Filter berdasarkan bulan (1-12)' })
  @IsOptional()
  @IsNumberString()
  bulan?: string;

  @ApiPropertyOptional({ description: 'Filter berdasarkan tahun (contoh: 2026)' })
  @IsOptional()
  @IsNumberString()
  tahun?: string;
}
