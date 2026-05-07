import { ApiProperty } from '@nestjs/swagger';

export class ProfilResponseDto {
  @ApiProperty({ description: 'ID pengguna' })
  id: string;

  @ApiProperty({ description: 'Email pengguna' })
  email: string;

  @ApiProperty({ description: 'Nama lengkap pengguna' })
  namaLengkap: string;

  @ApiProperty({ description: 'URL foto profil', required: false })
  fotoProfilUrl?: string;

  @ApiProperty({ description: 'Tanggal dibuat' })
  createdAt: Date;

  @ApiProperty({ description: 'Tanggal diupdate' })
  updatedAt: Date;
}
