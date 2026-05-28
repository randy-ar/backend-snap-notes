import { PartialType } from '@nestjs/swagger';
import { CreatePemasukanDto } from './create-pemasukan.dto';

export class UpdatePemasukanDto extends PartialType(CreatePemasukanDto) {}
