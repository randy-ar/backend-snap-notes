import { ApiProperty } from '@nestjs/swagger';

export class TrenItemDto {
  @ApiProperty({ description: 'Bulan (1-12)', example: 5 })
  bulan: number;

  @ApiProperty({ description: 'Tahun', example: 2026 })
  tahun: number;

  @ApiProperty({ description: 'Total Pemasukan', example: 5000000 })
  totalPemasukan: number;

  @ApiProperty({ description: 'Total Pengeluaran', example: 3500000 })
  totalPengeluaran: number;
}

export class TrenResponseDto {
  @ApiProperty({ type: [TrenItemDto] })
  data: TrenItemDto[];
}
