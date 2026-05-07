import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ItemStrukResponseDto {
  @ApiProperty({ description: 'ID item struk' })
  id: string;

  @ApiProperty({ description: 'Nama item' })
  namaItem: string;

  @ApiProperty({ description: 'Jumlah item' })
  jumlah: number;

  @ApiProperty({ description: 'Harga satuan' })
  hargaSatuan: number;

  @ApiProperty({ description: 'Subtotal (jumlah * harga_satuan)' })
  subtotal: number;

  @ApiPropertyOptional({ description: 'ID kategori item' })
  kategoriId?: string;

  @ApiPropertyOptional({ description: 'Nama kategori item' })
  kategoriNama?: string;
}

export class StrukResponseDto {
  @ApiProperty({ description: 'ID struk' })
  id: string;

  @ApiProperty({ description: 'ID pengguna' })
  penggunaId: string;

  @ApiPropertyOptional({ description: 'ID kategori toko' })
  kategoriId?: string;

  @ApiPropertyOptional({ description: 'Nama kategori toko' })
  kategoriNama?: string;

  @ApiProperty({ description: 'Nama toko/merchant' })
  namaToko: string;

  @ApiProperty({ description: 'Tanggal belanja' })
  tanggalBelanja: Date;

  @ApiProperty({ description: 'Total keseluruhan' })
  total: number;

  @ApiPropertyOptional({ description: 'URL gambar struk' })
  gambarUrl?: string;

  @ApiProperty({ description: 'Status sudah dikonfirmasi' })
  sudahDikonfirmasi: boolean;

  @ApiProperty({ description: 'Daftar item dalam struk', type: [ItemStrukResponseDto] })
  items: ItemStrukResponseDto[];

  @ApiProperty({ description: 'Tanggal dibuat' })
  createdAt: Date;

  @ApiProperty({ description: 'Tanggal diupdate' })
  updatedAt: Date;
}
