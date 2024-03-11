import { NestFactory } from '@nestjs/core';
import { AppModule } from './api/app.module';
import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify';
import secureSession from '@fastify/secure-session';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );
  await app.register(secureSession, {
    secret: 'averylogphrasebiggerthanthirtytwochars',
    salt: 'mq9hDxBVDbspDR6n',
    cookie: {
      path: '/'
    }
  });
  app.enableCors();
  app.useStaticAssets({
    root: join(__dirname, '../../../../', 'public'),
    prefix: '/public/'
  });
  app.setViewEngine({
    engine: {
      handlebars: require('handlebars')
    },
    templates: join(__dirname, '../../../../', 'views')
  });
  await app.listen(3000);
}

bootstrap();
