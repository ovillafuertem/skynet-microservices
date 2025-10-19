import { Module } from '@nestjs/common';
import { ClientsModule } from './clients/clients.module';
import { HealthModule } from './health/health.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
   ConfigModule.forRoot({ 
    isGlobal: true,
    envFilePath: [
      '.env','../../.env'
    ],
  }),
    AuthModule,
    ClientsModule, 
    HealthModule
  ],
})
export class AppModule {}
