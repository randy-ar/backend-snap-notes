import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { SupabaseModule } from './common/supabase/supabase.module';
import { StorageModule } from './common/storage/storage.module';
import { GeminiModule } from './common/gemini/gemini.module';
import { AuthModule } from './auth/auth.module';
import { StrukModule } from './struk/struk.module';
import { PengeluaranModule } from './pengeluaran/pengeluaran.module';
import { PemasukanModule } from './pemasukan/pemasukan.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotifikasiModule } from './notifikasi/notifikasi.module';
import { KategoriModule } from './kategori/kategori.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    SupabaseModule,
    StorageModule,
    GeminiModule,
    AuthModule,
    StrukModule,
    PengeluaranModule,
    PemasukanModule,
    DashboardModule,
    NotifikasiModule,
    KategoriModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
