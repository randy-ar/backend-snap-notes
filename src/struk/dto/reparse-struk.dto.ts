import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ReparseStrukDto {
  @ApiProperty({
    description: 'Konteks tambahan dari pengguna untuk mengoreksi hasil parsing AI',
    example: 'Ini adalah struk tagihan internet bulanan IndiHome',
  })
  @IsString()
  @IsNotEmpty({ message: 'Konteks atau prompt tidak boleh kosong' })
  prompt: string;
}
