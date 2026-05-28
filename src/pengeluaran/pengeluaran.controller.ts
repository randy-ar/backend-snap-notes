import { Controller, Post, Body, Req, UseGuards, Get, Query, Param, Patch, Delete, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { PengeluaranService } from './pengeluaran.service';
import { CreatePengeluaranDto } from './dto/create-pengeluaran.dto';
import { UpdatePengeluaranDto } from './dto/update-pengeluaran.dto';
import { QueryPengeluaranDto } from './dto/query-pengeluaran.dto';
import { PengeluaranResponseDto } from './dto/pengeluaran-response.dto';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
  };
}

@ApiTags('pengeluaran')
@Controller('pengeluaran')
export class PengeluaranController {
  constructor(private readonly pengeluaranService: PengeluaranService) {}

  @Post()
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tambah data pengeluaran secara manual' })
  @ApiResponse({ status: 201, description: 'Pengeluaran berhasil ditambahkan', type: PengeluaranResponseDto })
  @ApiResponse({ status: 400, description: 'Data tidak valid' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async tambah(
    @Req() req: RequestWithUser,
    @Body() dto: CreatePengeluaranDto,
  ): Promise<PengeluaranResponseDto> {
    return this.pengeluaranService.tambah(req.user.id, dto);
  }

  @Get()
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mendapatkan daftar pengeluaran (bisa difilter bulan/tahun)' })
  @ApiResponse({ status: 200, description: 'Daftar pengeluaran berhasil diambil', type: [PengeluaranResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDaftar(
    @Req() req: RequestWithUser,
    @Query() query: QueryPengeluaranDto,
  ): Promise<PengeluaranResponseDto[]> {
    return this.pengeluaranService.getDaftar(req.user.id, query);
  }

  @Get(':id')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mendapatkan detail pengeluaran' })
  @ApiResponse({ status: 200, description: 'Detail pengeluaran berhasil diambil', type: PengeluaranResponseDto })
  @ApiResponse({ status: 404, description: 'Pengeluaran tidak ditemukan' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDetail(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<PengeluaranResponseDto> {
    return this.pengeluaranService.getDetail(req.user.id, id);
  }

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Memperbarui data pengeluaran' })
  @ApiResponse({ status: 200, description: 'Pengeluaran berhasil diperbarui', type: PengeluaranResponseDto })
  @ApiResponse({ status: 404, description: 'Pengeluaran tidak ditemukan' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdatePengeluaranDto,
  ): Promise<PengeluaranResponseDto> {
    return this.pengeluaranService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: 'Menghapus data pengeluaran' })
  @ApiResponse({ status: 204, description: 'Pengeluaran berhasil dihapus' })
  @ApiResponse({ status: 404, description: 'Pengeluaran tidak ditemukan' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async hapus(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.pengeluaranService.hapus(req.user.id, id);
  }
}
