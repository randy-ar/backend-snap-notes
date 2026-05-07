import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface StorageResultDto {
  path: string;
  publicUrl: string;
}

@Injectable()
export class StorageService {
  private readonly bucketName = 'struk-images';

  constructor(private supabaseService: SupabaseService) {}

  async uploadGambarStruk(file: Buffer, fileName: string): Promise<StorageResultDto> {
    const client = this.supabaseService.getClient();
    const path = `struk/${Date.now()}-${fileName}`;
    
    const { error } = await client.storage
      .from(this.bucketName)
      .upload(path, file, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      throw new Error(`Gagal upload gambar: ${error.message}`);
    }

    const { data: publicUrlData } = client.storage
      .from(this.bucketName)
      .getPublicUrl(path);

    return {
      path,
      publicUrl: publicUrlData.publicUrl,
    };
  }

  async hapusGambar(path: string): Promise<void> {
    const client = this.supabaseService.getClient();
    
    const { error } = await client.storage
      .from(this.bucketName)
      .remove([path]);

    if (error) {
      throw new Error(`Gagal menghapus gambar: ${error.message}`);
    }
  }

  getPublicUrl(path: string): string {
    const client = this.supabaseService.getClient();
    const { data } = client.storage
      .from(this.bucketName)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }
}
