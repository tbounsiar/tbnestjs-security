import { Module } from '@nestjs/common';
import { AppController } from './controller/app.controller';
import { AppService } from './service/app.service';
import { securityConfig } from '../config/security.config';
import { SecurityModule } from '../../../../src';
import { PrismaService } from './dao/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { UserService } from './dao/user.service';

@Module({
  imports: [ConfigModule.forRoot(), SecurityModule.forRoot(securityConfig)],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    UserService
  ]
})
export class AppModule {
}
