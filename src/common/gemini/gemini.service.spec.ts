import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GeminiService, ParsedStrukDto } from './gemini.service';
import { ServiceUnavailableException, UnprocessableEntityException } from '@nestjs/common';

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: jest.fn(),
    },
  })),
}));

import { GoogleGenAI } from '@google/genai';

const mockedGoogleGenAI = GoogleGenAI as jest.MockedClass<typeof GoogleGenAI>;

describe('GeminiService', () => {
  let service: GeminiService;
  let mockGenerateContent: jest.Mock;

  beforeEach(async () => {
    mockGenerateContent = jest.fn();
    
    mockedGoogleGenAI.mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent,
      },
    } as any));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-api-key'),
          },
        },
      ],
    }).compile();

    service = module.get<GeminiService>(GeminiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('parseStrukOCR', () => {
    it('should return valid parsed data when AI response is valid JSON', async () => {
      const rawText = 'INDOMARET JL. MERDEKA\nTanggal: 07/05/2026\nIndomie Goreng x3 @3500 = 10500\nTotal: 85000';
      const mockResponse = {
        text: JSON.stringify({
          nama_toko: 'Indomaret Jl. Merdeka',
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
        }),
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await service.parseStrukOCR(rawText);

      expect(result).toBeDefined();
      expect(result.nama_toko).toBe('Indomaret Jl. Merdeka');
      expect(result.tanggal).toBe('2026-05-07');
      expect(result.total).toBe(85000);
      expect(result.item).toHaveLength(1);
      expect(result.item[0].nama).toBe('Indomie Goreng');
      expect(result.item[0].subtotal).toBe(10500);
    });

    it('should calculate subtotal if not provided', async () => {
      const rawText = 'Test receipt';
      const mockResponse = {
        text: JSON.stringify({
          nama_toko: 'Test Store',
          tanggal: '2026-05-07',
          total: 10000,
          item: [
            {
              nama: 'Test Item',
              jumlah: 2,
              harga_satuan: 5000,
            },
          ],
        }),
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await service.parseStrukOCR(rawText);

      expect(result.item[0].subtotal).toBe(10000);
    });

    it('should throw ServiceUnavailableException when AI returns empty response', async () => {
      const rawText = 'Test receipt';
      mockGenerateContent.mockResolvedValue({ text: null });

      await expect(service.parseStrukOCR(rawText)).rejects.toThrow(ServiceUnavailableException);
    });

    it('should throw ServiceUnavailableException when AI throws error', async () => {
      const rawText = 'Test receipt';
      mockGenerateContent.mockRejectedValue(new Error('AI Error'));

      await expect(service.parseStrukOCR(rawText)).rejects.toThrow(ServiceUnavailableException);
    });

    it('should throw UnprocessableEntityException when response is invalid JSON', async () => {
      const rawText = 'Test receipt';
      mockGenerateContent.mockResolvedValue({ text: 'not valid json' });

      await expect(service.parseStrukOCR(rawText)).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw UnprocessableEntityException when JSON is missing required fields', async () => {
      const rawText = 'Test receipt';
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({ nama_toko: 'Test' }),
      });

      await expect(service.parseStrukOCR(rawText)).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw UnprocessableEntityException when item array is empty', async () => {
      const rawText = 'Test receipt';
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          nama_toko: 'Test Store',
          tanggal: '2026-05-07',
          total: 10000,
          item: [],
        }),
      });

      await expect(service.parseStrukOCR(rawText)).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw UnprocessableEntityException when item format is invalid', async () => {
      const rawText = 'Test receipt';
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          nama_toko: 'Test Store',
          tanggal: '2026-05-07',
          total: 10000,
          item: [{ nama: 'Item without price' }],
        }),
      });

      await expect(service.parseStrukOCR(rawText)).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('buatPrompt', () => {
    it('should include rawText in the prompt', async () => {
      const rawText = 'INDOMARET TEST';
      const mockResponse = {
        text: JSON.stringify({
          nama_toko: 'Test',
          tanggal: '2026-05-07',
          total: 1000,
          item: [{ nama: 'Item', jumlah: 1, harga_satuan: 1000, subtotal: 1000 }],
        }),
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      await service.parseStrukOCR(rawText);

      const promptArg = mockGenerateContent.mock.calls[0][0].contents;
      expect(promptArg).toContain(rawText);
      expect(promptArg).toContain('Anda adalah parser struk belanja');
    });
  });
});
