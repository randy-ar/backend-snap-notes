import { Controller, Post, Body, Req, UseGuards, Get, Query, Param, Patch, Delete, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { PemasukanService } from './pemasukan.service';
import { CreatePemasukanDto } from './dto/create-pemasukan.dto';
import { UpdatePemasukanDto } from './dto/update-pemasukan.dto';
import { QueryPemasukanDto } from './dto/query-pemasukan.dto';
import { PemasukanResponseDto } from './dto/pemasukan-response.dto';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
  };
}

@ApiTags('pemasukan')
@Controller('pemasukan')
export class PemasukanController {
  constructor(private readonly pemasukanService: PemasukanService) {}

  @Post()
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tambah data pemasukan secara manual' })
  @ApiResponse({ status: 201, description: 'Pemasukan berhasil ditambahkan', type: PemasukanResponseDto })
  @ApiResponse({ status: 400, description: 'Data tidak valid' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async tambah(
    @Req() req: RequestWithUser,
    @Body() dto: CreatePemasukanDto,
  ): Promise<PemasukanResponseDto> {
    return this.pemasukanService.tambah(req.user.id, dto);
  }

  @Get()
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mendapatkan daftar pemasukan (bisa difilter bulan/tahun)' })
  @ApiResponse({ status: 200, description: 'Daftar pemasukan berhasil diambil', type: [PemasukanResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDaftar(
    @Req() req: RequestWithUser,
    @Query() query: QueryPemasukanDto,
  ): Promise<PemasukanResponseDto[]> {
    return this.pemasukanService.getDaftar(req.user.id, query);
  }

  @Get(':id')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mendapatkan detail pemasukan' })
  @ApiResponse({ status: 200, description: 'Detail pemasukan berhasil diambil', type: PemasukanResponseDto })
  @ApiResponse({ status: 404, description: 'Pemasukan tidak ditemukan' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDetail(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<PemasukanResponseDto> {
    return this.pemasukanService.getDetail(req.user.id, id);
  }

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Memperbarui data pemasukan' })
  @ApiResponse({ status: 200, description: 'Pemasukan berhasil diperbarui', type: PemasukanResponseDto })
  @ApiResponse({ status: 404, description: 'Pemasukan tidak ditemukan' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdatePemasukanDto,
  ): Promise<PemasukanResponseDto> {
    return this.pemasukanService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: 'Menghapus data pemasukan' })
  @ApiResponse({ status: 204, description: 'Pemasukan berhasil dihapus' })
  @ApiResponse({ status: 404, description: 'Pemasukan tidak ditemukan' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async hapus(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.pemasukanService.hapus(req.user.id, id);
  }
}
