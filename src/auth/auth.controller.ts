import { Controller, Post, Get, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { AuthService } from './auth.service';
import { DaftarDto } from './dto/daftar.dto';
import { MasukDto } from './dto/masuk.dto';
import { RefreshDto } from './dto/refresh.dto';
import { UpdateProfilDto } from './dto/update-profil.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ProfilResponseDto } from './dto/profil-response.dto';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('daftar')
  @ApiOperation({ summary: 'Daftar pengguna baru' })
  @ApiResponse({ status: 201, description: 'Pengguna berhasil didaftarkan', type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'Email sudah terdaftar' })
  @ApiResponse({ status: 401, description: 'Gagal mendaftar' })
  async daftar(@Body() dto: DaftarDto): Promise<AuthResponseDto> {
    return this.authService.daftar(dto);
  }

  @Post('masuk')
  @ApiOperation({ summary: 'Masuk dengan email dan password' })
  @ApiResponse({ status: 200, description: 'Berhasil masuk', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Email atau password salah' })
  async masuk(@Body() dto: MasukDto): Promise<AuthResponseDto> {
    return this.authService.masuk(dto);
  }

  @Post('keluar')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Keluar dari sesi' })
  @ApiResponse({ status: 200, description: 'Berhasil keluar' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async keluar(@Body() dto: RefreshDto): Promise<void> {
    return this.authService.keluar(dto.refreshToken);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token berhasil di-refresh', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Refresh token tidak valid' })
  async refresh(@Body() dto: RefreshDto): Promise<AuthResponseDto> {
    return this.authService.refresh(dto);
  }

  @Get('profil')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ambil data profil pengguna' })
  @ApiResponse({ status: 200, description: 'Data profil', type: ProfilResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Pengguna tidak ditemukan' })
  async getProfil(@Req() req: RequestWithUser): Promise<ProfilResponseDto> {
    return this.authService.getProfil(req.user.id);
  }

  @Patch('profil')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update data profil pengguna' })
  @ApiResponse({ status: 200, description: 'Profil berhasil diupdate', type: ProfilResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Pengguna tidak ditemukan' })
  async updateProfil(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateProfilDto,
  ): Promise<ProfilResponseDto> {
    return this.authService.updateProfil(req.user.id, dto);
  }
}
