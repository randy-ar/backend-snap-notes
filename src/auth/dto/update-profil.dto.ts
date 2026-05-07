import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateProfilDto {
  @ApiPropertyOptional({ description: 'Nama lengkap pengguna' })
  @IsString()
  @IsOptional()
  @MinLength(1, { message: 'Nama lengkap minimal 1 karakter' })
  namaLengkap?: string;

  @ApiPropertyOptional({ description: 'URL foto profil' })
  @IsString()
  @IsOptional()
  fotoProfilUrl?: string;
}
