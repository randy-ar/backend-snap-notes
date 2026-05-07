import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

async function generate() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('Snap Notes API')
    .setDescription('API untuk aplikasi pencatat pengeluaran dari struk belanja')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  
  fs.writeFileSync('./swagger-spec.yaml', yaml.dump(document), 'utf8');
  console.log('Swagger specification exported to swagger-spec.yaml');
  await app.close();
}

generate();
