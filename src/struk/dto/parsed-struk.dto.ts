import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ParsedItemDto {
  @ApiProperty({ description: 'Nama item' })
  nama: string;

  @ApiProperty({ description: 'Jumlah item' })
  jumlah: number;

  @ApiProperty({ description: 'Harga satuan item' })
  harga_satuan: number;

  @ApiProperty({ description: 'Subtotal (jumlah * harga_satuan)' })
  subtotal: number;

  @ApiPropertyOptional({ description: 'Kategori item' })
  kategori?: string;
}

export class ParsedStrukDto {
  @ApiProperty({ description: 'Nama toko/merchant' })
  nama_toko: string;

  @ApiProperty({ description: 'Tanggal belanja (YYYY-MM-DD)' })
  tanggal: string;

  @ApiProperty({ description: 'Total keseluruhan struk' })
  total: number;

  @ApiPropertyOptional({ description: 'Kategori toko' })
  kategori_toko?: string;

  @ApiProperty({ description: 'Daftar item dalam struk', type: [ParsedItemDto] })
  item: ParsedItemDto[];
}
