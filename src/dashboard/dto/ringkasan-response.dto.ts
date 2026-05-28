import { ApiProperty } from '@nestjs/swagger';

export class RingkasanResponseDto {
  @ApiProperty({ description: 'Total pemasukan pada periode yang diminta' })
  totalPemasukan: number;

  @ApiProperty({ description: 'Total pengeluaran pada periode yang diminta' })
  totalPengeluaran: number;

  @ApiProperty({ description: 'Selisih total pemasukan dan total pengeluaran (bisa negatif)' })
  saldo: number;
}
