import { PartialType } from '@nestjs/swagger';
import { CreatePengeluaranDto } from './create-pengeluaran.dto';

export class UpdatePengeluaranDto extends PartialType(CreatePengeluaranDto) {}
