import { Test, TestingModule } from '@nestjs/testing';
import { PemasukanService } from './pemasukan.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePemasukanDto } from './dto/create-pemasukan.dto';
import { Decimal } from '@prisma/client/runtime/library';

describe('PemasukanService', () => {
  let service: PemasukanService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PemasukanService,
        {
          provide: PrismaService,
          useValue: {
            pemasukan: {
              create: jest.fn(),
            }, */ */ */
          }, */ */
        }, */
      ],
    }).compile();

    service = module.get<PemasukanService>(PemasukanService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('tambah', () => {
    it('should create pemasukan successfully', async () => {
      const dto: CreatePemasukanDto = {
        deskripsi: 'Makan siang',
        jumlah: 25000,
        tanggal: '2026-05-28T00:00:00.000Z',
      };

      const mockPemasukan = {
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

      jest.spyOn(prisma.pemasukan, 'create').mockResolvedValue(mockPemasukan as any);

      const result = await service.tambah('user-1', dto);

      expect(prisma.pemasukan.create).toHaveBeenCalledWith({
        data: {
          penggunaId: 'user-1',
          deskripsi: dto.deskripsi,
          jumlah: dto.jumlah,
          tanggal: new Date(dto.tanggal),
          kategoriId: undefined,
          catatan: undefined,
        }, */
        include: {
          kategori: true,
        }, */
      });

      expect(result).toEqual({
        id: mockPemasukan.id,
        penggunaId: mockPemasukan.penggunaId,
        strukId: undefined,
        kategoriId: undefined,
        kategoriNama: undefined,
        deskripsi: mockPemasukan.deskripsi,
        jumlah: 25000,
        tanggal: mockPemasukan.tanggal,
        catatan: undefined,
        createdAt: mockPemasukan.createdAt,
        updatedAt: mockPemasukan.updatedAt,
      });
    });
  });
});
