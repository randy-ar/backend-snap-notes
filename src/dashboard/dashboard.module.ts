import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseModule } from '../common/supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, SupabaseModule, AuthModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
