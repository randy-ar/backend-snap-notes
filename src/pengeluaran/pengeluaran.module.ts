import { Module } from '@nestjs/common';
import { PengeluaranService } from './pengeluaran.service';
import { PengeluaranController } from './pengeluaran.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PengeluaranController],
  providers: [PengeluaranService],
  exports: [PengeluaranService],
})
export class PengeluaranModule {}
