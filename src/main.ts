import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { EnvironmentVariables } from './config/env.validation';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Cinema API')
    .setDescription(
      'Films, halls, showings and seat bookings, stored in MongoDB. Seats and bookings are embedded in the showing document. Every id is an ObjectId: a string of 24 hexadecimal characters (a malformed id gives 400, a well-formed id of a missing document gives 404). Prices are integers in kopiykas (12500 = 125 UAH).',
    )
    .setVersion('2.0')
    .build();
  SwaggerModule.setup(
    'docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  const port = app
    .get<ConfigService<EnvironmentVariables, true>>(ConfigService)
    .get('PORT', { infer: true });
  await app.listen(port);
}

void bootstrap();
