import { Injectable, UnprocessableEntityException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ILLMProvider,
  ParsedStrukDto,
  OcrLine,
  ImageSize,
} from './llm-provider.interface';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  error?: {
    message: string;
  };
}

@Injectable()
export class OpenRouterService implements ILLMProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY harus diatur di environment variables');
    }
    this.apiKey = apiKey;
    this.model = this.configService.get<string>('OPENROUTER_MODEL') || 'google/gemini-1.5-flash';
    this.timeoutMs = this.configService.get<number>('OPENROUTER_TIMEOUT_MS') || 28000;
  }

  async parseStrukOCR(rawText: string, lines?: OcrLine[], imageSize?: ImageSize): Promise<ParsedStrukDto> {
    try {
      const prompt = this.buatPrompt(rawText, lines, imageSize);
      const messages: OpenRouterMessage[] = [
        {
          role: 'system',
          content: 'Anda adalah parser struk belanja yang mengkonversi teks OCR menjadi JSON terstruktur. Selalu kembalikan JSON valid tanpa markdown.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ];

      const openRouterPromise = this.callOpenRouter(messages);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('OpenRouter timeout')), this.timeoutMs);
      });

      const response = await Promise.race([openRouterPromise, timeoutPromise]);

      const text = response.choices?.[0]?.message?.content;
      console.log('[OpenRouter] Raw response:', text);

      if (!text) {
        throw new ServiceUnavailableException('OpenRouter tidak memberikan response');
      }

      return this.validasiResponse(text);
    } catch (error) {
      if (error instanceof ServiceUnavailableException || error instanceof UnprocessableEntityException) {
        throw error;
      }
      if (error.message === 'OpenRouter timeout') {
        throw new ServiceUnavailableException('OpenRouter timeout - coba lagi dengan struk yang lebih jelas');
      }
      throw new ServiceUnavailableException(`OpenRouter error: ${error.message}`);
    }
  }

  private async callOpenRouter(messages: OpenRouterMessage[]): Promise<OpenRouterResponse> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://snap-notes.app',
        'X-Title': 'Snap Notes Backend',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.1,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.json() as Promise<OpenRouterResponse>;
  }

  private buatPrompt(rawText: string, lines?: OcrLine[], imageSize?: ImageSize): string {
    let layoutInfo = '';

    if (lines && lines.length > 0 && imageSize) {
      const lineInfo = lines.map((line) => {
        const centerX = (line.boundingBox.left + line.boundingBox.right) / 2;
        const centerY = (line.boundingBox.top + line.boundingBox.bottom) / 2;
        const relativeX = (centerX / imageSize.width * 100).toFixed(1);
        const relativeY = (centerY / imageSize.height * 100).toFixed(1);
        const textPreview = line.text.substring(0, 40);
        const ellipsis = line.text.length > 40 ? '...' : '';
        return `[${line.lineIndex}] X:${relativeX}% Y:${relativeY}% | "${textPreview}${ellipsis}"`;
      }).join('\n');

      layoutInfo = `

INFO LAYOUT LINE POSISI (persentase dari ukuran gambar ${imageSize.width}x${imageSize.height}px):
${lineInfo}

Analisis posisi:
- X 0-30% = Kolom kiri (biasanya nama item/produk)
- X 30-60% = Kolom tengah (biasanya qty/jumlah)
- X 60-100% = Kolom kanan (biasanya harga/total)
- Y urutan dari atas ke bawah menunjukkan urutan item
- lineIndex menunjukkan urutan baris dari atas ke bawah`;
    }

    const currentDate = new Date().toISOString().split('T')[0];

    return `Anda adalah parser struk belanja. Analisis teks OCR berikut dan ekstrak informasi struk ke format JSON.

TEKS OCR:
"""
${rawText}
"""${layoutInfo}

Ekstrak informasi berikut dalam format JSON:
{
  "nama_toko": "Nama toko/merchant",
  "tanggal": "YYYY-MM-DD",
  "total": 0,
  "kategori_toko": "Kategori toko (opsional)",
  "item": [
    {
      "nama": "Nama item",
      "jumlah": 1,
      "harga_satuan": 0,
      "subtotal": 0,
      "kategori": "Kategori item (opsional)"
    }
  ]
}

Aturan WAJIB:
1. SELALU kembalikan semua field yang dibutuhkan, jangan biarkan kosong
2. Jika nama_toko tidak ditemukan, gunakan "Tidak diketahui"
3. Jika tanggal tidak ditemukan dalam teks, gunakan tanggal hari ini: ${currentDate}
4. Jika total tidak ditemukan, jumlahkan semua subtotal dari item untuk mendapatkan total
5. Jika tidak ada item produk sama sekali yang bisa diidentifikasi, return JSON dengan error message di field "error": "Gambar struk tidak jelas, mohon upload ulang"
6. Tanggal harus dalam format YYYY-MM-DD (konversi dari format Indonesia DD-MM-YYYY atau DD/MM/YYYY)
7. Total adalah angka total keseluruhan struk (bukan subtotal item)
8. Harga dalam format number tanpa pemisah ribuan (contoh: 10500 bukan 10.500)
9. Kategori bisa: Makanan & Minuman, Transportasi, Kesehatan, Pendidikan, Hiburan, Rumah Tangga, Pakaian & Aksesoris, Belanja Online, Lainnya
10. Pastikan jumlah * harga_satuan = subtotal untuk setiap item
11. Gunakan info posisi X untuk membedakan kolom: kiri=item, tengah=qty, kanan=harga
12. Jika ada teks seperti "1 5,000" di posisi tengah+kanan, interpretasikan sebagai qty=1, harga=5000
13. Return HANYA JSON, tanpa markdown atau penjelasan lain`;
  }

  private validasiResponse(text: string): ParsedStrukDto {
    try {
      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (parsed.error) {
        throw new UnprocessableEntityException(parsed.error);
      }

      if (!parsed.nama_toko || !parsed.tanggal || typeof parsed.total !== 'number') {
        throw new UnprocessableEntityException('Response AI tidak lengkap: nama_toko, tanggal, dan total wajib ada');
      }

      if (!Array.isArray(parsed.item) || parsed.item.length === 0) {
        throw new UnprocessableEntityException('Response AI tidak valid: item harus berupa array tidak kosong');
      }

      parsed.item.forEach((item: Record<string, unknown>, index: number) => {
        if (!item.nama || typeof item.jumlah !== 'number' || typeof item.harga_satuan !== 'number') {
          throw new UnprocessableEntityException(`Item ke-${index + 1} tidak valid: nama, jumlah, dan harga_satuan wajib ada`);
        }
        if (!item.subtotal) {
          item.subtotal = (item.jumlah as number) * (item.harga_satuan as number);
        }
      });

      return parsed as ParsedStrukDto;
    } catch (error) {
      if (error instanceof UnprocessableEntityException) {
        throw error;
      }
      throw new UnprocessableEntityException(`Gagal parse response AI: ${(error as Error).message}`);
    }
  }
}
