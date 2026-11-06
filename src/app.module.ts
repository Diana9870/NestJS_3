import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingsModule } from './bookings/bookings.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { EnvironmentVariables, validateEnv } from './config/env.validation';
import { FilmsModule } from './films/films.module';
import { HallsModule } from './halls/halls.module';
import { ShowingsModule } from './showings/showings.module';

@Module({
  imports: [
    // Reads .env and validates it (class-validator, see env.validation.ts).
    // The application does not start if a variable is missing or malformed.
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    // The connection string comes from ConfigService, not from process.env.
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        uri: config.get('MONGODB_URI', { infer: true }),
      }),
    }),
    FilmsModule,
    HallsModule,
    ShowingsModule,
    BookingsModule,
  ],
  providers: [
    {
      // Global ValidationPipe. Registered here (not only in main.ts) so that
      // it is active for any app built from AppModule.
      // whitelist: properties without a DTO decorator are stripped, so fields
      // that are not in a DTO never reach a service.
      // transform: bodies and queries become DTO class instances.
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true, transform: true }),
    },
    {
      // One error body for every failure: { statusCode, message, path }.
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
