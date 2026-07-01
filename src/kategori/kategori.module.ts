import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseModule } from '../common/supabase/supabase.module';
import { KategoriController } from './kategori.controller';
import { KategoriService } from './kategori.service';

@Module({
  imports: [PrismaModule, SupabaseModule],
  controllers: [KategoriController],
  providers: [KategoriService],
})
export class KategoriModule {}
