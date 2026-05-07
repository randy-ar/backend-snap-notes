import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import express from 'express';

let cachedApp: any;

const bootstrap = async () => {
  if (!cachedApp) {
    const expressApp = express();
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );
    const configService = app.get(ConfigService);

    // Remove global prefix since Vercel already routes through /api directory
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }));
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    const swaggerEnabled = configService.get<string>('SWAGGER_ENABLED') === 'true';
    if (swaggerEnabled) {
      const config = new DocumentBuilder()
        .setTitle('Snap Notes API')
        .setDescription('API untuk aplikasi pencatat pengeluaran dari struk belanja')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('docs', app, document);
    }

    await app.init();
    cachedApp = expressApp;
  }
  return cachedApp;
};

export default async (req: any, res: any) => {
  const app = await bootstrap();
  app(req, res);
};
