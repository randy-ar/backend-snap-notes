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

  async parseStrukOCR(rawText: string): Promise<ParsedStrukDto> {
    try {
      const prompt = this.buatPrompt(rawText);
      
      const response = await this.genAI.models.generateContent({
        model: this.model,
        contents: prompt,
      });

      const text = response.text;
      if (!text) {
        throw new ServiceUnavailableException('Gemini AI tidak memberikan response');
      }

      return this.validasiResponse(text);
    } catch (error) {
      if (error instanceof ServiceUnavailableException || error instanceof UnprocessableEntityException) {
        throw error;
      }
      throw new ServiceUnavailableException(`Gemini AI error: ${error.message}`);
    }
  }

  private buatPrompt(rawText: string): string {
    return `Anda adalah parser struk belanja. Analisis teks OCR berikut dan ekstrak informasi struk ke format JSON.

TEKS OCR:
"""
${rawText}
"""

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

Aturan:
1. Tanggal harus dalam format YYYY-MM-DD
2. Total adalah angka total keseluruhan struk (bukan subtotal item)
3. Harga dalam format number tanpa pemisah ribuan
4. Kategori bisa: Makanan & Minuman, Transportasi, Kesehatan, Pendidikan, Hiburan, Rumah Tangga, Pakaian & Aksesoris, Belanja Online, Lainnya
5. Pastikan jumlah * harga_satuan = subtotal untuk setiap item
6. Return HANYA JSON, tanpa markdown atau penjelasan lain`;
  }

  private validasiResponse(response: string): ParsedStrukDto {
    try {
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned) as ParsedStrukDto;

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
