import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { KategoriService } from './kategori.service';
import { KategoriResponseDto } from './dto/kategori-response.dto';
import { JenisKategori } from '@prisma/client';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
  };
}

@ApiTags('kategori')
@Controller('kategori')
export class KategoriController {
  constructor(private readonly kategoriService: KategoriService) {}

  @Get()
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mendapatkan daftar kategori (presets + kustom user)' })
  @ApiQuery({ name: 'jenis', required: false, enum: JenisKategori, description: 'Filter jenis kategori' })
  @ApiResponse({ status: 200, description: 'Daftar kategori berhasil diambil', type: [KategoriResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDaftar(
    @Req() req: RequestWithUser,
    @Query('jenis') jenis?: JenisKategori,
  ): Promise<KategoriResponseDto[]> {
    return this.kategoriService.getDaftar(req.user.id, jenis);
  }
}
