import { Test, TestingModule } from '@nestjs/testing';
import { NotifikasiService } from './notifikasi.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('NotifikasiService', () => {
  let service: NotifikasiService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    preferensiNotifikasi: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotifikasiService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<NotifikasiService>(NotifikasiService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPreferensiList', () => {
    it('should return list of preferensi', async () => {
      const mockList = [{ id: '1', penggunaId: 'user-1' }];
      mockPrismaService.preferensiNotifikasi.findMany.mockResolvedValue(mockList);

      const result = await service.getPreferensiList('user-1');

      expect(result).toEqual(mockList);
      expect(prismaService.preferensiNotifikasi.findMany).toHaveBeenCalledWith({
        where: { penggunaId: 'user-1' },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('createPreferensi', () => {
    it('should create new preferensi', async () => {
      mockPrismaService.preferensiNotifikasi.create.mockResolvedValue({ id: '2', penggunaId: 'user-1', aktif: true });

      const result = await service.createPreferensi('user-1', { jamNotifikasi: '19:00', hariAktif: ['1', '2'] });

      expect(result.id).toBe('2');
      expect(prismaService.preferensiNotifikasi.create).toHaveBeenCalledWith({
        data: {
          penggunaId: 'user-1',
          hariAktif: ['1', '2'],
          jamNotifikasi: '19:00',
          aktif: true,
        },
      });
    });
  });

  describe('updatePreferensi', () => {
    it('should update if found and belongs to user', async () => {
      const existing = { id: '1', penggunaId: 'user-1', hariAktif: ['1'], jamNotifikasi: '10:00', aktif: true };
      mockPrismaService.preferensiNotifikasi.findUnique.mockResolvedValue(existing);
      mockPrismaService.preferensiNotifikasi.update.mockResolvedValue({ ...existing, aktif: false });

      const result = await service.updatePreferensi('user-1', '1', { aktif: false });

      expect(result.aktif).toBe(false);
      expect(prismaService.preferensiNotifikasi.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          hariAktif: ['1'],
          jamNotifikasi: '10:00',
          aktif: false,
        },
      });
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.preferensiNotifikasi.findUnique.mockResolvedValue(null);
      await expect(service.updatePreferensi('user-1', '1', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('deletePreferensi', () => {
    it('should delete if found and belongs to user', async () => {
      const existing = { id: '1', penggunaId: 'user-1' };
      mockPrismaService.preferensiNotifikasi.findUnique.mockResolvedValue(existing);
      mockPrismaService.preferensiNotifikasi.delete.mockResolvedValue(existing);

      await service.deletePreferensi('user-1', '1');

      expect(prismaService.preferensiNotifikasi.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException if not found or wrong user', async () => {
      const existing = { id: '1', penggunaId: 'user-2' };
      mockPrismaService.preferensiNotifikasi.findUnique.mockResolvedValue(existing);

      await expect(service.deletePreferensi('user-1', '1')).rejects.toThrow(NotFoundException);
    });
  });
});
