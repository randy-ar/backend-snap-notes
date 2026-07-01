import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class PreferensiNotifikasiDto {
  @ApiProperty({
    description: 'Array representasi hari aktif dalam string integer 1-7 (1=Senin, 7=Minggu)',
    example: ['1', '2', '3', '4', '5'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ message: 'Hari aktif tidak boleh kosong' })
  hariAktif: string[];

  @ApiProperty({
    description: 'Jam notifikasi dalam format HH:mm',
    example: '19:30',
  })
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Format jam notifikasi harus HH:mm',
  })
  @IsNotEmpty({ message: 'Jam notifikasi tidak boleh kosong' })
  jamNotifikasi: string;

  @ApiPropertyOptional({
    description: 'Status master untuk notifikasi',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  aktif?: boolean;
}

export class UpdatePreferensiNotifikasiDto {
  @ApiPropertyOptional({
    description: 'Array representasi hari aktif dalam string integer 1-7 (1=Senin, 7=Minggu)',
    example: ['1', '2', '3', '4', '5'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hariAktif?: string[];

  @ApiPropertyOptional({
    description: 'Jam notifikasi dalam format HH:mm',
    example: '19:30',
  })
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Format jam notifikasi harus HH:mm',
  })
  @IsOptional()
  jamNotifikasi?: string;

  @ApiPropertyOptional({
    description: 'Status master untuk notifikasi',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  aktif?: boolean;
}
