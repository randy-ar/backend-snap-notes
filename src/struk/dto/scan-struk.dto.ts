import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class BoundingBoxDto {
  @ApiProperty({ description: 'Koordinat kiri (X)', example: 977.0 })
  @IsNumber()
  left: number;

  @ApiProperty({ description: 'Koordinat atas (Y)', example: 562.0 })
  @IsNumber()
  top: number;

  @ApiProperty({ description: 'Koordinat kanan (X)', example: 1406.0 })
  @IsNumber()
  right: number;

  @ApiProperty({ description: 'Koordinat bawah (Y)', example: 786.0 })
  @IsNumber()
  bottom: number;
}

class OcrLineDto {
  @ApiProperty({ description: 'Index baris', example: 0 })
  @IsNumber()
  lineIndex: number;

  @ApiProperty({ description: 'Teks dalam satu baris', example: "Indomaret" })
  @IsString()
  text: string;

  @ApiProperty({ description: 'Bounding box posisi', type: BoundingBoxDto })
  @ValidateNested()
  @Type(() => BoundingBoxDto)
  boundingBox: BoundingBoxDto;
}

class ImageSizeDto {
  @ApiProperty({ description: 'Lebar gambar dalam pixel', example: 2304.0 })
  @IsNumber()
  width: number;

  @ApiProperty({ description: 'Tinggi gambar dalam pixel', example: 4096.0 })
  @IsNumber()
  height: number;
}

export class OcrDataDto {
  @ApiProperty({ description: 'Teks lengkap hasil OCR', example: "Indomaret\nJl. Sudirman No.1\nNasi Goreng  12000\n..." })
  @IsString()
  @IsNotEmpty({ message: 'Teks OCR tidak boleh kosong' })
  rawText: string;

  @ApiProperty({ description: 'Ukuran gambar original', type: ImageSizeDto })
  @ValidateNested()
  @Type(() => ImageSizeDto)
  imageSize: ImageSizeDto;

  @ApiProperty({ description: 'Jumlah lines', example: 5, required: false })
  @IsOptional()
  @IsNumber()
  linesCount?: number;

  @ApiProperty({ description: 'Prompt kustom opsional dari user untuk AI', required: false })
  @IsOptional()
  @IsString()
  customPrompt?: string;

  @ApiProperty({ description: 'Array lines dengan posisi dan index', type: [OcrLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OcrLineDto)
  lines: OcrLineDto[];
}

export class ScanStrukDto {
  @ApiProperty({
    description: 'Data OCR dalam format JSON string',
    example: '{"rawText":"Indomaret\nJl. Sudirman No.1...","imageSize":{"width":1080,"height":1920},"lines":[{"lineIndex":0,"text":"Indomaret","boundingBox":{"left":120,"top":45,"right":420,"bottom":80}}]}'
  })
  @IsString()
  @IsNotEmpty({ message: 'Data OCR tidak boleh kosong' })
  ocrData: string;
}
