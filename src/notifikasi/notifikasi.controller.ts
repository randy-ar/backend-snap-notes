import { Body, Controller, Get, Patch, Post, Request, UseGuards, Param, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { NotifikasiService } from './notifikasi.service';
import { PreferensiNotifikasiDto, UpdatePreferensiNotifikasiDto } from './dto/preferensi-notifikasi.dto';

@ApiTags('notifikasi')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('notifikasi')
export class NotifikasiController {
  constructor(private readonly notifikasiService: NotifikasiService) {}

  @Get('preferensi')
  @ApiOperation({ summary: 'Mendapatkan daftar preferensi notifikasi pengguna' })
  @ApiResponse({ status: 200, description: 'Berhasil mendapatkan daftar preferensi' })
  async getPreferensiList(@Request() req: any) {
    const penggunaId = req.user.id;
    return this.notifikasiService.getPreferensiList(penggunaId);
  }

  @Post('preferensi')
  @ApiOperation({ summary: 'Membuat jadwal preferensi notifikasi baru' })
  @ApiResponse({ status: 201, description: 'Berhasil membuat preferensi' })
  async createPreferensi(
    @Request() req: any,
    @Body() dto: PreferensiNotifikasiDto,
  ) {
    const penggunaId = req.user.id;
    return this.notifikasiService.createPreferensi(penggunaId, dto);
  }

  @Patch('preferensi/:id')
  @ApiOperation({ summary: 'Memperbarui sebagian preferensi notifikasi berdasarkan ID' })
  @ApiResponse({ status: 200, description: 'Berhasil memperbarui preferensi' })
  @ApiResponse({ status: 404, description: 'Preferensi tidak ditemukan' })
  async updatePreferensi(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePreferensiNotifikasiDto,
  ) {
    const penggunaId = req.user.id;
    return this.notifikasiService.updatePreferensi(penggunaId, id, dto);
  }

  @Delete('preferensi/:id')
  @ApiOperation({ summary: 'Menghapus jadwal preferensi notifikasi berdasarkan ID' })
  @ApiResponse({ status: 200, description: 'Berhasil menghapus preferensi' })
  @ApiResponse({ status: 404, description: 'Preferensi tidak ditemukan' })
  async deletePreferensi(
    @Request() req: any,
    @Param('id') id: string,
  ) {
    const penggunaId = req.user.id;
    return this.notifikasiService.deletePreferensi(penggunaId, id);
  }
}
