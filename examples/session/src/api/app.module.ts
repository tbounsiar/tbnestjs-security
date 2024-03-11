import { Module } from '@nestjs/common';
import { HomeController } from './controller/home.controller';
import { HomeService } from './service/home.service';
import { PrismaService } from './dao/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { UserService } from './dao/user.service';
import { securityModule } from '../config/security.config';
import { LoginPageController } from '../config/controller/login-page.controller';
import { LoginController } from '../config/controller/login.controller';
import { AdminController } from './controller/admin.controller';

@Module({
  imports: [ConfigModule.forRoot(), securityModule],
  controllers: [
    HomeController,
    LoginPageController,
    LoginController,
    AdminController
  ],
  providers: [HomeService, PrismaService, UserService]
})
export class AppModule {}
