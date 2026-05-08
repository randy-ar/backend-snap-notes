import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({ description: 'Google ID token dari Flutter' })
  @IsString()
  @IsNotEmpty({ message: 'ID token tidak boleh kosong' })
  idToken: string;
}
