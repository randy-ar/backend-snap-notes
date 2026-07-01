import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { StorageService } from './src/common/storage/storage.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const storageService = app.get(StorageService);
  
  const buffer = Buffer.from('fake image from nestjs');
  const testUserId = '83b8d8cd-e7e1-4eb8-862d-93ff725c45a9'; // dummy user ID
  
  try {
    const result = await storageService.uploadGambarStruk(buffer, 'test-nest.jpg', testUserId);
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error);
  }
  
  await app.close();
}
bootstrap();
