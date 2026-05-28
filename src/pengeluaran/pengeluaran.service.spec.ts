import { Test, TestingModule } from '@nestjs/testing';
import { PengeluaranService } from './pengeluaran.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePengeluaranDto } from './dto/create-pengeluaran.dto';
import { Decimal } from '@prisma/client/runtime/library';

describe('PengeluaranService', () => {
  let service: PengeluaranService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PengeluaranService,
        {
          provide: PrismaService,
          useValue: {
            pengeluaran: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<PengeluaranService>(PengeluaranService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('tambah', () => {
    it('should create pengeluaran successfully', async () => {
      const dto: CreatePengeluaranDto = {
        deskripsi: 'Makan siang',
        jumlah: 25000,
        tanggal: '2026-05-28T00:00:00.000Z',
      };

      const mockPengeluaran = {
        id: '1',
        penggunaId: 'user-1',
        strukId: null,
        kategoriId: null,
        deskripsi: 'Makan siang',
        jumlah: new Decimal(25000),
        tanggal: new Date('2026-05-28T00:00:00.000Z'),
        catatan: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        kategori: null,
      };

      jest.spyOn(prisma.pengeluaran, 'create').mockResolvedValue(mockPengeluaran as any);

      const result = await service.tambah('user-1', dto);

      expect(prisma.pengeluaran.create).toHaveBeenCalledWith({
        data: {
          penggunaId: 'user-1',
          deskripsi: dto.deskripsi,
          jumlah: dto.jumlah,
          tanggal: new Date(dto.tanggal),
          kategoriId: undefined,
          catatan: undefined,
        },
        include: {
          kategori: true,
        },
      });

      expect(result).toEqual({
        id: mockPengeluaran.id,
        penggunaId: mockPengeluaran.penggunaId,
        strukId: undefined,
        kategoriId: undefined,
        kategoriNama: undefined,
        deskripsi: mockPengeluaran.deskripsi,
        jumlah: 25000,
        tanggal: mockPengeluaran.tanggal,
        catatan: undefined,
        createdAt: mockPengeluaran.createdAt,
        updatedAt: mockPengeluaran.updatedAt,
      });
    });
  });
});
