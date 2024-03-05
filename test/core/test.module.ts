import { Module } from '@nestjs/common';
import { AdminController } from './controller/admin.controller';
import { HomeController } from './controller/home.controller';

@Module({
  controllers: [AdminController, HomeController],
})
export class TestModule {

}