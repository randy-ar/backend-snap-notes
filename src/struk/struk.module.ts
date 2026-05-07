import { Module } from '@nestjs/common';
import { StrukController } from './struk.controller';
import { StrukService } from './struk.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GeminiModule } from '../common/gemini/gemini.module';
import { StorageModule } from '../common/storage/storage.module';
import { SupabaseModule } from '../common/supabase/supabase.module';

@Module({
  imports: [PrismaModule, GeminiModule, StorageModule, SupabaseModule],
  controllers: [StrukController],
  providers: [StrukService],
  exports: [StrukService],
})
export class StrukModule {}
