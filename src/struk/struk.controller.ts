import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { StrukService } from './struk.service';
import { ScanStrukDto } from './dto/scan-struk.dto';
import { ReparseStrukDto } from './dto/reparse-struk.dto';
import { UpdateStrukDto } from './dto/update-struk.dto';
import { StrukResponseDto } from './dto/struk-response.dto';
import { QueryStrukDto } from './dto/query-struk.dto';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
  };
}

@ApiTags('struk')
@Controller('struk')
export class StrukController {
  constructor(private readonly strukService: StrukService) {}

  @Post('scan')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Scan struk dengan OCR dan AI' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Scan struk dengan gambar dan teks OCR',
    type: ScanStrukDto,
  })
  @ApiResponse({ status: 201, description: 'Struk berhasil diproses', type: StrukResponseDto })
  @ApiResponse({ status: 400, description: 'Data tidak valid' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 503, description: 'Service AI tidak tersedia' })
  @UseInterceptors(FileInterceptor('gambar'))
  async scanStruk(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ScanStrukDto,
  ): Promise<StrukResponseDto> {
    return this.strukService.scanStruk(req.user.id, file, dto);
  }

  @Post(':id/reparse')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proses ulang struk dengan memberikan konteks AI (Koreksi)' })
  @ApiBody({
    description: 'Konteks tambahan untuk AI',
    type: ReparseStrukDto,
  })
  @ApiResponse({ status: 200, description: 'Struk berhasil diproses ulang', type: StrukResponseDto })
  @ApiResponse({ status: 400, description: 'Data tidak valid' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Struk tidak ditemukan' })
  @ApiResponse({ status: 503, description: 'Service AI tidak tersedia' })
  async reparseStruk(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: ReparseStrukDto,
  ): Promise<StrukResponseDto> {
    return this.strukService.reparseStruk(req.user.id, id, dto);
  }

  @Get()
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ambil daftar struk pengguna' })
  @ApiResponse({ status: 200, description: 'Daftar struk', type: [StrukResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDaftarStruk(
    @Req() req: RequestWithUser,
    @Query() queryDto: QueryStrukDto,
  ): Promise<StrukResponseDto[]> {
    const query = {
      bulan: queryDto.bulan ? parseInt(queryDto.bulan, 10) : undefined,
      tahun: queryDto.tahun ? parseInt(queryDto.tahun, 10) : undefined,
    };
    return this.strukService.getDaftarStruk(req.user.id, query);
  }

  @Get(':id')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ambil detail struk berdasarkan ID' })
  @ApiResponse({ status: 200, description: 'Detail struk', type: StrukResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - bukan milik pengguna' })
  @ApiResponse({ status: 404, description: 'Struk tidak ditemukan' })
  async getDetailStruk(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<StrukResponseDto> {
    return this.strukService.getDetailStruk(req.user.id, id);
  }

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update data struk' })
  @ApiResponse({ status: 200, description: 'Struk berhasil diupdate', type: StrukResponseDto })
  @ApiResponse({ status: 400, description: 'Data tidak valid' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - bukan milik pengguna' })
  @ApiResponse({ status: 404, description: 'Struk tidak ditemukan' })
  async updateStruk(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateStrukDto,
  ): Promise<StrukResponseDto> {
    return this.strukService.updateStruk(req.user.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hapus struk beserta gambar dan pengeluaran terkait' })
  @ApiResponse({ status: 200, description: 'Struk berhasil dihapus' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - bukan milik pengguna' })
  @ApiResponse({ status: 404, description: 'Struk tidak ditemukan' })
  async hapusStruk(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.strukService.hapusStruk(req.user.id, id);
  }

  @Post(':id/konfirmasi')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Konfirmasi struk sudah ditinjau' })
  @ApiResponse({ status: 200, description: 'Struk berhasil dikonfirmasi', type: StrukResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - bukan milik pengguna' })
  @ApiResponse({ status: 404, description: 'Struk tidak ditemukan' })
  async konfirmasiStruk(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<StrukResponseDto> {
    return this.strukService.konfirmasiStruk(req.user.id, id);
  }
}
