import { Module } from '@nestjs/common';
import { PemasukanService } from './pemasukan.service';
import { PemasukanController } from './pemasukan.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PemasukanController],
  providers: [PemasukanService],
  exports: [PemasukanService],
})
export class PemasukanModule {}
