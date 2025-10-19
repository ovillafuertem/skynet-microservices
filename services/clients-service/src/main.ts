import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {cors: true});

  const config = new DocumentBuilder()
  .setTitle('SkyNet Clients Service')
  .setDescription('API de Clientes')
  .setVersion('1.0')
  .addBearerAuth(
    { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
    'access-token', // This name here is important for matching the @ApiBearerAuth() decorator
  )
  .build();

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  /*const config = new DocumentBuilder()
    .setTitle('Clients Service')
    .setDescription('API para gestión de clientes (CRUD)')
    .setVersion('1.0.0')
    .addTag('clients')
    .build();*/

  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;

  await app.listen(port);
  console.log(`Clients Service on http://localhost:${port}  | Swagger: /docs`);
}
bootstrap();
