import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { RingkasanResponseDto } from './dto/ringkasan-response.dto';
import { QueryDashboardDto } from './dto/query-dashboard.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('ringkasan')
  @ApiOperation({
    summary: 'Mendapatkan ringkasan dashboard (total pemasukan, pengeluaran, saldo)',
  })
  @ApiResponse({
    status: 200,
    description: 'Ringkasan berhasil diambil',
    type: RingkasanResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRingkasan(
    @Req() req: any,
    @Query() query: QueryDashboardDto,
  ): Promise<RingkasanResponseDto> {
    const penggunaId = req.user.sub;
    return this.dashboardService.getRingkasan(penggunaId, query);
  }

  @Get('trend')
  @ApiOperation({
    summary: 'Mendapatkan tren ringkasan dashboard selama 6 bulan terakhir',
  })
  @ApiResponse({
    status: 200,
    description: 'Tren berhasil diambil',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTrend(
    @Req() req: any,
    @Query() query: QueryDashboardDto,
  ): Promise<any[]> {
    const penggunaId = req.user.sub;
    return this.dashboardService.getTrend(penggunaId, query);
  }
}
