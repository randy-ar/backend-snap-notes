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

export interface OcrLine {
  lineIndex: number;
  text: string;
  boundingBox: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
}

export interface ImageSize {
  width: number;
  height: number;
}

export interface ILLMProvider {
  parseStrukOCR(rawText: string, lines?: OcrLine[], imageSize?: ImageSize, customPrompt?: string, kategoriContext?: string): Promise<ParsedStrukDto>;
}
