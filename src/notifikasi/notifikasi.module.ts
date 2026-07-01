import { Module } from '@nestjs/common';
import { NotifikasiController } from './notifikasi.controller';
import { NotifikasiService } from './notifikasi.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [NotifikasiController],
  providers: [NotifikasiService],
})
export class NotifikasiModule {}
