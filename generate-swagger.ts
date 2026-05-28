import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './src/app.module';
import * as fs from 'fs';
import * as yaml from 'yaml';

async function generateSwagger() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('Snap Notes API')
    .setDescription('API untuk aplikasi pencatat pengeluaran dari struk belanja')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  const yamlString = yaml.stringify(document);
  fs.writeFileSync('./swagger-spec.yaml', yamlString);
  console.log('Swagger YAML generated');
  await app.close();
}

generateSwagger();
