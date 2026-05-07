import { Module } from '@nestjs/common';
import { SupabaseModule } from '../common/supabase/supabase.module';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';

@Module({
  imports: [SupabaseModule],
  providers: [SupabaseAuthGuard],
  exports: [SupabaseAuthGuard],
})
export class AuthModule {}
