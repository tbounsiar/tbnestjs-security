import { Module } from '@nestjs/common';
// @ts-ignore
import { AdminController } from './controller/admin.controller';
// @ts-ignore
import { HomeController } from './controller/home.controller';

@Module({
  controllers: [AdminController, HomeController]
})
export class TestModule {}
