import { Injectable, UnprocessableEntityException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

export interface ParsedItemDto {
  nama: string;
  jumlah: number;
  harga_satuan: number;
  subtotal: number;
  kategori?: string;
}

export interface ParsedStrukDto {
  nama_toko: string;
  tanggal: string;
  total: number;
  kategori_toko?: string;
  item: ParsedItemDto[];
}

interface OcrLine {
  lineIndex: number;
  text: string;
  boundingBox: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
}

interface ImageSize {
  width: number;
  height: number;
}

@Injectable()
export class GeminiService {
  private genAI: GoogleGenAI;
  private model: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY harus diatur di environment variables');
    }
    this.genAI = new GoogleGenAI({ apiKey });
    this.model = 'gemini-2.5-flash';
  }

  async parseStrukOCR(rawText: string, lines?: OcrLine[], imageSize?: ImageSize): Promise<ParsedStrukDto> {
    try {
      const prompt = this.buatPrompt(rawText, lines, imageSize);

      const geminiPromise = this.genAI.models.generateContent({
        model: this.model,
        contents: prompt,
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Gemini AI timeout')), 25000);
      });

      const response = await Promise.race([geminiPromise, timeoutPromise]);

      const text = response.text;
      console.log('[Gemini AI] Raw response:', text);
      if (!text) {
        throw new ServiceUnavailableException('Gemini AI tidak memberikan response');
      }

      return this.validasiResponse(text);
    } catch (error) {
      if (error instanceof ServiceUnavailableException || error instanceof UnprocessableEntityException) {
        throw error;
      }
      if (error.message === 'Gemini AI timeout') {
        throw new ServiceUnavailableException('Gemini AI timeout - coba lagi dengan struk yang lebih jelas');
      }
      throw new ServiceUnavailableException(`Gemini AI error: ${error.message}`);
    }
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
1. SELALY kembalikan semua field yang dibutuhkan, jangan biarkan kosong
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

  private validasiResponse(response: string): ParsedStrukDto {
    try {
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned) as ParsedStrukDto & { error?: string };

      // Cek jika AI mengembalikan error message
      if (parsed.error) {
        throw new UnprocessableEntityException(parsed.error);
      }

      if (!parsed.nama_toko || !parsed.tanggal || typeof parsed.total !== 'number') {
        throw new UnprocessableEntityException('Format JSON dari AI tidak lengkap');
      }

      if (!Array.isArray(parsed.item) || parsed.item.length === 0) {
        throw new UnprocessableEntityException('JSON tidak memiliki array item yang valid');
      }

      for (const item of parsed.item) {
        if (!item.nama || typeof item.jumlah !== 'number' || typeof item.harga_satuan !== 'number') {
          throw new UnprocessableEntityException('Format item dalam JSON tidak valid');
        }
        if (!item.subtotal) {
          item.subtotal = item.jumlah * item.harga_satuan;
        }
      }

      return parsed;
    } catch (error) {
      if (error instanceof UnprocessableEntityException) {
        throw error;
      }
      throw new UnprocessableEntityException(`Response AI tidak valid JSON: ${error.message}`);
    }
  }
}
