import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, UnprocessableEntityException, ServiceUnavailableException } from '@nestjs/common';
import { StrukService } from './struk.service';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../common/gemini/gemini.service';
import { StorageService } from '../common/storage/storage.service';

describe('StrukService', () => {
  let service: StrukService;
  let prismaService: any;
  let geminiService: any;
  let storageService: any;

  const mockPenggunaId = 'user-123';
  const mockStrukId = 'struk-123';
  
  const mockParsedData = {
    nama_toko: 'Indomaret',
    tanggal: '2026-05-07',
    total: 85000,
    kategori_toko: 'Makanan & Minuman',
    item: [
      {
        nama: 'Indomie Goreng',
        jumlah: 3,
        harga_satuan: 3500,
        subtotal: 10500,
        kategori: 'Makanan',
      },
    ],
  };

  const createMockOcrData = () => ({
    rawText: 'Indomaret\nJl. Sudirman No.1\nNasi Goreng  12000',
    imageSize: { width: 1080, height: 1920 },
    linesCount: 3,
    lines: [
      {
        lineIndex: 0,
        text: 'Indomaret',
        boundingBox: { left: 120, top: 45, right: 420, bottom: 80 },
      },
      {
        lineIndex: 1,
        text: 'Jl. Sudirman No.1',
        boundingBox: { left: 100, top: 90, right: 500, bottom: 125 },
      },
      {
        lineIndex: 2,
        text: 'Nasi Goreng  12000',
        boundingBox: { left: 80, top: 200, right: 980, bottom: 235 },
      },
    ],
  });

  const createMockPrismaService = () => ({
    struk: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    itemStruk: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    pengeluaran: {
      create: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    kategori: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  });

  const mockGeminiService = () => ({
    parseStrukOCR: jest.fn(),
  });

  const mockStorageService = () => ({
    uploadGambarStruk: jest.fn(),
    hapusGambar: jest.fn(),
  });

  beforeEach(async () => {
    const mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StrukService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: GeminiService,
          useValue: mockGeminiService(),
        },
        {
          provide: StorageService,
          useValue: mockStorageService(),
        },
      ],
    }).compile();

    service = module.get<StrukService>(StrukService);
    prismaService = module.get(PrismaService);
    geminiService = module.get(GeminiService);
    storageService = module.get(StorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('scanStruk', () => {
    it('should successfully scan struk and save to database', async () => {
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'test.jpg',
      } as Express.Multer.File;

      const mockOcrData = createMockOcrData();
      const dto = { ocrData: JSON.stringify(mockOcrData) };
      const storageResult = { path: 'struk/test.jpg', publicUrl: 'http://test.com/test.jpg' };

      geminiService.parseStrukOCR.mockResolvedValue(mockParsedData);
      storageService.uploadGambarStruk.mockResolvedValue(storageResult);

      const createdStruk = {
        id: mockStrukId,
        penggunaId: mockPenggunaId,
        kategoriId: null,
        namaToko: 'Indomaret',
        tanggalBelanja: new Date('2026-05-07'),
        total: 85000,
        gambarUrl: 'http://test.com/test.jpg',
        gambarStoragePath: 'struk/test.jpg',
        rawTextOcr: dto.ocrData,
        sudahDikonfirmasi: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        kategori: null,
      };

      prismaService.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          struk: {
            create: jest.fn().mockResolvedValue(createdStruk),
          },
          itemStruk: {
            create: jest.fn().mockResolvedValue({
              id: 'item-123',
              strukId: mockStrukId,
              namaItem: 'Indomie Goreng',
              jumlah: 3,
              hargaSatuan: 3500,
              subtotal: 10500,
              kategoriId: null,
              kategori: null,
            }),
          },
          pengeluaran: {
            create: jest.fn().mockResolvedValue({ id: 'pengeluaran-123' }),
          },
          kategori: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        };
        return callback(tx);
      });

      const result = await service.scanStruk(mockPenggunaId, mockFile, dto);

      expect(geminiService.parseStrukOCR).toHaveBeenCalledWith(
        mockOcrData.rawText,
        mockOcrData.lines,
        mockOcrData.imageSize
      );
      expect(storageService.uploadGambarStruk).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.namaToko).toBe('Indomaret');
    });

    it('should throw ServiceUnavailableException when Gemini fails', async () => {
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'test.jpg',
      } as Express.Multer.File;
      const mockOcrData = createMockOcrData();
      const dto = { ocrData: JSON.stringify(mockOcrData) };

      geminiService.parseStrukOCR.mockRejectedValue(new ServiceUnavailableException('AI Error'));

      await expect(service.scanStruk(mockPenggunaId, mockFile, dto)).rejects.toThrow(ServiceUnavailableException);
    });

    it('should throw UnprocessableEntityException when AI returns invalid JSON', async () => {
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'test.jpg',
      } as Express.Multer.File;
      const mockOcrData = createMockOcrData();
      const dto = { ocrData: JSON.stringify(mockOcrData) };

      geminiService.parseStrukOCR.mockRejectedValue(new UnprocessableEntityException('Invalid JSON'));

      await expect(service.scanStruk(mockPenggunaId, mockFile, dto)).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw UnprocessableEntityException when ocrData JSON is invalid', async () => {
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'test.jpg',
      } as Express.Multer.File;
      const dto = { ocrData: 'invalid json' };

      await expect(service.scanStruk(mockPenggunaId, mockFile, dto)).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw UnprocessableEntityException when ocrData structure is incomplete', async () => {
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'test.jpg',
      } as Express.Multer.File;
      const dto = { ocrData: JSON.stringify({ rawText: 'test' }) }; // missing lines

      await expect(service.scanStruk(mockPenggunaId, mockFile, dto)).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('getDetailStruk', () => {
    it('should return struk detail when found and owned by user', async () => {
      const mockStruk = {
        id: mockStrukId,
        penggunaId: mockPenggunaId,
        namaToko: 'Indomaret',
        kategori: null,
        itemStruks: [],
      };

      prismaService.struk.findUnique.mockResolvedValue(mockStruk as any);

      const result = await service.getDetailStruk(mockPenggunaId, mockStrukId);

      expect(result).toBeDefined();
      expect(prismaService.struk.findUnique).toHaveBeenCalledWith({
        where: { id: mockStrukId },
        include: {
          kategori: true,
          itemStruks: { include: { kategori: true } },
        },
      });
    });

    it('should throw NotFoundException when struk not found', async () => {
      prismaService.struk.findUnique.mockResolvedValue(null);

      await expect(service.getDetailStruk(mockPenggunaId, mockStrukId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when struk belongs to another user', async () => {
      const mockStruk = {
        id: mockStrukId,
        penggunaId: 'other-user',
        namaToko: 'Indomaret',
      };

      prismaService.struk.findUnique.mockResolvedValue(mockStruk as any);

      await expect(service.getDetailStruk(mockPenggunaId, mockStrukId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('hapusStruk', () => {
    it('should successfully delete struk and its image', async () => {
      const mockStruk = {
        id: mockStrukId,
        penggunaId: mockPenggunaId,
        gambarStoragePath: 'struk/test.jpg',
      };

      prismaService.struk.findUnique.mockResolvedValue(mockStruk as any);
      prismaService.$transaction.mockResolvedValue(undefined);
      storageService.hapusGambar.mockResolvedValue(undefined);

      await service.hapusStruk(mockPenggunaId, mockStrukId);

      expect(prismaService.pengeluaran.deleteMany).toHaveBeenCalled();
      expect(prismaService.itemStruk.deleteMany).toHaveBeenCalled();
      expect(prismaService.struk.delete).toHaveBeenCalled();
      expect(storageService.hapusGambar).toHaveBeenCalledWith('struk/test.jpg');
    });

    it('should throw NotFoundException when struk not found', async () => {
      prismaService.struk.findUnique.mockResolvedValue(null);

      await expect(service.hapusStruk(mockPenggunaId, mockStrukId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when struk belongs to another user', async () => {
      const mockStruk = {
        id: mockStrukId,
        penggunaId: 'other-user',
        gambarStoragePath: 'struk/test.jpg',
      };

      prismaService.struk.findUnique.mockResolvedValue(mockStruk as any);

      await expect(service.hapusStruk(mockPenggunaId, mockStrukId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('konfirmasiStruk', () => {
    it('should successfully confirm struk', async () => {
      const mockStruk = {
        id: mockStrukId,
        penggunaId: mockPenggunaId,
        namaToko: 'Indomaret',
        kategori: null,
        itemStruks: [],
        sudahDikonfirmasi: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.struk.findUnique.mockResolvedValue(mockStruk as any);
      prismaService.struk.update.mockResolvedValue(mockStruk as any);

      const result = await service.konfirmasiStruk(mockPenggunaId, mockStrukId);

      expect(result.sudahDikonfirmasi).toBe(true);
      expect(prismaService.struk.update).toHaveBeenCalledWith({
        where: { id: mockStrukId },
        data: { sudahDikonfirmasi: true },
        include: {
          kategori: true,
          itemStruks: { include: { kategori: true } },
        },
      });
    });
  });

  describe('getDaftarStruk', () => {
    it('should return list of struk for user', async () => {
      const mockStruks = [
        {
          id: 'struk-1',
          penggunaId: mockPenggunaId,
          namaToko: 'Indomaret',
          kategori: null,
          itemStruks: [],
        },
        {
          id: 'struk-2',
          penggunaId: mockPenggunaId,
          namaToko: 'Alfamart',
          kategori: null,
          itemStruks: [],
        },
      ];

      prismaService.struk.findMany.mockResolvedValue(mockStruks as any);

      const result = await service.getDaftarStruk(mockPenggunaId);

      expect(result).toHaveLength(2);
      expect(prismaService.struk.findMany).toHaveBeenCalledWith({
        where: { penggunaId: mockPenggunaId },
        include: {
          kategori: true,
          itemStruks: { include: { kategori: true } },
        },
        orderBy: { tanggalBelanja: 'desc' },
      });
    });

    it('should filter by month and year when provided', async () => {
      prismaService.struk.findMany.mockResolvedValue([]);

      await service.getDaftarStruk(mockPenggunaId, { bulan: 5, tahun: 2026 });

      expect(prismaService.struk.findMany).toHaveBeenCalledWith({
        where: {
          penggunaId: mockPenggunaId,
          tanggalBelanja: {
            gte: new Date(2026, 4, 1),
            lte: new Date(2026, 5, 0),
          },
        },
        include: {
          kategori: true,
          itemStruks: { include: { kategori: true } },
        },
        orderBy: { tanggalBelanja: 'desc' },
      });
    });
  });
});
