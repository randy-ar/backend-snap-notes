import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class QueryTrenDto {
  @ApiProperty({ description: 'Bulan mulai (1-12)', example: '1' })
  @IsString()
  @Matches(/^(1[0-2]|[1-9])$/, { message: 'Bulan mulai harus antara 1 dan 12' })
  bulan_mulai: string;

  @ApiProperty({ description: 'Tahun mulai (contoh: 2026)', example: '2026' })
  @IsString()
  @Matches(/^\d{4}$/, { message: 'Tahun mulai harus 4 digit' })
  tahun_mulai: string;

  @ApiProperty({ description: 'Bulan selesai (1-12)', example: '6' })
  @IsString()
  @Matches(/^(1[0-2]|[1-9])$/, { message: 'Bulan selesai harus antara 1 dan 12' })
  bulan_selesai: string;

  @ApiProperty({ description: 'Tahun selesai (contoh: 2026)', example: '2026' })
  @IsString()
  @Matches(/^\d{4}$/, { message: 'Tahun selesai harus 4 digit' })
  tahun_selesai: string;
}
