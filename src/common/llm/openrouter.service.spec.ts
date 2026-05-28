import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OpenRouterService } from './openrouter.service';
import { ServiceUnavailableException, UnprocessableEntityException } from '@nestjs/common';

describe('OpenRouterService', () => {
  let service: OpenRouterService;

  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenRouterService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string | number> = {
                'OPENROUTER_API_KEY': 'sk-or-v1-test-key',
                'OPENROUTER_MODEL': 'google/gemini-flash-1.5',
                'OPENROUTER_TIMEOUT_MS': 28000,
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<OpenRouterService>(OpenRouterService);
  });

  describe('parseStrukOCR', () => {
    it('should return valid parsed data when API response is valid JSON', async () => {
      const rawText = 'INDOMARET JL. MERDEKA\nTanggal: 07/05/2026\nIndomie Goreng x3 @3500 = 10500\nTotal: 85000';
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
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
          },
        }],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

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
        choices: [{
          message: {
            content: JSON.stringify({
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
          },
        }],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.parseStrukOCR(rawText);

      expect(result.item[0].subtotal).toBe(10000);
    });

    it('should throw ServiceUnavailableException when API returns error', async () => {
      const rawText = 'Test receipt';

      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded',
      });

      await expect(service.parseStrukOCR(rawText)).rejects.toThrow(ServiceUnavailableException);
    });

    it('should throw ServiceUnavailableException when API throws network error', async () => {
      const rawText = 'Test receipt';

      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(service.parseStrukOCR(rawText)).rejects.toThrow(ServiceUnavailableException);
    });

    it('should throw ServiceUnavailableException when API returns empty choices', async () => {
      const rawText = 'Test receipt';

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [] }),
      });

      await expect(service.parseStrukOCR(rawText)).rejects.toThrow(ServiceUnavailableException);
    });

    it('should throw UnprocessableEntityException when response is invalid JSON', async () => {
      const rawText = 'Test receipt';

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'not valid json',
            },
          }],
        }),
      });

      await expect(service.parseStrukOCR(rawText)).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw UnprocessableEntityException when JSON is missing required fields', async () => {
      const rawText = 'Test receipt';

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({ nama_toko: 'Test' }),
            },
          }],
        }),
      });

      await expect(service.parseStrukOCR(rawText)).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw UnprocessableEntityException when item array is empty', async () => {
      const rawText = 'Test receipt';

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                nama_toko: 'Test Store',
                tanggal: '2026-05-07',
                total: 10000,
                item: [],
              }),
            },
          }],
        }),
      });

      await expect(service.parseStrukOCR(rawText)).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw UnprocessableEntityException when AI returns error field', async () => {
      const rawText = 'Test receipt';

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                error: 'Gambar struk tidak jelas, mohon upload ulang',
              }),
            },
          }],
        }),
      });

      await expect(service.parseStrukOCR(rawText)).rejects.toThrow(UnprocessableEntityException);
    });

    it('should handle JSON wrapped in markdown code block', async () => {
      const rawText = 'Test receipt';
      const mockResponse = {
        choices: [{
          message: {
            content: '```json\n{"nama_toko":"Test Store","tanggal":"2026-05-07","total":10000,"item":[{"nama":"Item","jumlah":1,"harga_satuan":10000,"subtotal":10000}]}\n```',
          },
        }],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.parseStrukOCR(rawText);

      expect(result.nama_toko).toBe('Test Store');
    });
  });

  describe('constructor', () => {
    it('should throw error when OPENROUTER_API_KEY is not set', async () => {
      await expect(
        Test.createTestingModule({
          providers: [
            OpenRouterService,
            {
              provide: ConfigService,
              useValue: {
                get: jest.fn(() => undefined),
              },
            },
          ],
        }).compile()
      ).rejects.toThrow('OPENROUTER_API_KEY harus diatur di environment variables');
    });

    it('should use default model when OPENROUTER_MODEL is not set', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          OpenRouterService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'OPENROUTER_API_KEY') return 'sk-or-v1-test';
                return undefined;
              }),
            },
          },
        ],
      }).compile();

      const svc = module.get<OpenRouterService>(OpenRouterService);
      expect(svc).toBeDefined();
    });
  });
});
