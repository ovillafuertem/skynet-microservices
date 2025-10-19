"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const docConfig = new swagger_1.DocumentBuilder()
        .setTitle('SkyNet Notifications Service')
        .setDescription('Procesa notificaciones y reportes PDF para visitas completadas')
        .setVersion('1.0')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, docConfig);
    swagger_1.SwaggerModule.setup('docs', app, document);
    const port = parseInt(process.env.PORT ?? '3003', 10);
    await app.listen(port);
    console.log(`Notifications service running at http://localhost:${port}/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map