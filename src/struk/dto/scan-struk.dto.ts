import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ScanStrukDto {
  @ApiProperty({ description: 'Teks hasil OCR dari Google ML Kit' })
  @IsString()
  @IsNotEmpty({ message: 'Teks OCR tidak boleh kosong' })
  rawText: string;

  @ApiPropertyOptional({ description: 'ID pengguna (opsional jika endpoint public)' })
  @IsString()
  @IsOptional()
  penggunaId?: string;
}
