import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const docConfig = new DocumentBuilder()
    .setTitle('SkyNet Notifications Service')
    .setDescription('Procesa notificaciones y reportes PDF para visitas completadas')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, docConfig);
  SwaggerModule.setup('docs', app, document);

  const port = parseInt(process.env.PORT ?? '3003', 10);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Notifications service running at http://localhost:${port}/docs`);
}

bootstrap();
