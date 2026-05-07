import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { PrismaService } from '../prisma/prisma.service';
import { DaftarDto } from './dto/daftar.dto';
import { MasukDto } from './dto/masuk.dto';
import { RefreshDto } from './dto/refresh.dto';
import { UpdateProfilDto } from './dto/update-profil.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ProfilResponseDto } from './dto/profil-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private prisma: PrismaService,
  ) {}

  async daftar(dto: DaftarDto): Promise<AuthResponseDto> {
    const client = this.supabaseService.getClient();

    const { data: authData, error: authError } = await client.auth.signUp({
      email: dto.email,
      password: dto.password,
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        throw new ConflictException('Email sudah terdaftar');
      }
      throw new UnauthorizedException(authError.message);
    }

    if (!authData.user || !authData.session) {
      throw new UnauthorizedException('Gagal membuat pengguna');
    }

    const pengguna = await this.prisma.pengguna.create({
      data: {
        id: authData.user.id,
        email: dto.email,
        namaLengkap: dto.namaLengkap,
      },
    });

    return {
      accessToken: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
      userId: pengguna.id,
      email: pengguna.email,
    };
  }

  async masuk(dto: MasukDto): Promise<AuthResponseDto> {
    const client = this.supabaseService.getClient();

    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (authError || !authData.user || !authData.session) {
      throw new UnauthorizedException('Email atau password salah, atau sesi tidak dapat dibuat. Pastikan email telah dikonfirmasi.');
    }

    const pengguna = await this.prisma.pengguna.findUnique({
      where: { id: authData.user.id },
    });

    if (!pengguna) {
      throw new NotFoundException('Data pengguna tidak ditemukan');
    }

    return {
      accessToken: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
      userId: pengguna.id,
      email: pengguna.email,
    };
  }

  async keluar(refreshToken: string): Promise<void> {
    const client = this.supabaseService.getClient();

    const { error } = await client.auth.signOut();

    if (error) {
      throw new UnauthorizedException('Gagal keluar');
    }
  }

  async refresh(dto: RefreshDto): Promise<AuthResponseDto> {
    const client = this.supabaseService.getClient();

    const { data: authData, error: authError } = await client.auth.refreshSession({
      refresh_token: dto.refreshToken,
    });

    if (authError || !authData.user || !authData.session) {
      throw new UnauthorizedException('Refresh token tidak valid atau sudah expired');
    }

    const pengguna = await this.prisma.pengguna.findUnique({
      where: { id: authData.user.id },
    });

    if (!pengguna) {
      throw new NotFoundException('Data pengguna tidak ditemukan');
    }

    return {
      accessToken: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
      userId: pengguna.id,
      email: pengguna.email,
    };
  }

  async getProfil(userId: string): Promise<ProfilResponseDto> {
    const pengguna = await this.prisma.pengguna.findUnique({
      where: { id: userId },
    });

    if (!pengguna) {
      throw new NotFoundException('Pengguna tidak ditemukan');
    }

    return {
      id: pengguna.id,
      email: pengguna.email,
      namaLengkap: pengguna.namaLengkap,
      fotoProfilUrl: pengguna.fotoProfilUrl || undefined,
      createdAt: pengguna.createdAt,
      updatedAt: pengguna.updatedAt,
    };
  }

  async updateProfil(userId: string, dto: UpdateProfilDto): Promise<ProfilResponseDto> {
    const pengguna = await this.prisma.pengguna.update({
      where: { id: userId },
      data: {
        ...(dto.namaLengkap && { namaLengkap: dto.namaLengkap }),
        ...(dto.fotoProfilUrl !== undefined && { fotoProfilUrl: dto.fotoProfilUrl }),
      },
    });

    return {
      id: pengguna.id,
      email: pengguna.email,
      namaLengkap: pengguna.namaLengkap,
      fotoProfilUrl: pengguna.fotoProfilUrl || undefined,
      createdAt: pengguna.createdAt,
      updatedAt: pengguna.updatedAt,
    };
  }
}
