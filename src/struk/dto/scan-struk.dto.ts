import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ScanStrukDto {
  @ApiProperty({ description: 'Teks hasil OCR dari Google ML Kit' })
  @IsString()
  @IsNotEmpty({ message: 'Teks OCR tidak boleh kosong' })
  rawText: string;
}
