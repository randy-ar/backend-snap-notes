import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryPengeluaranDto {
  @ApiPropertyOptional({ description: 'Bulan (1-12)', example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  bulan?: number;

  @ApiPropertyOptional({ description: 'Tahun', example: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  tahun?: number;

  @ApiPropertyOptional({ description: 'Halaman untuk paginasi (default: 1)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Jumlah item per halaman (default: 10)', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
