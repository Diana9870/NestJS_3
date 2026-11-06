import { plainToInstance, Type } from 'class-transformer';
import 'reflect-metadata';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  validateSync,
} from 'class-validator';

/**
 * Every variable the service reads from the environment (.env). Validated at
 * start-up with the same class-validator decorators as the DTOs: if
 * MONGODB_URI is missing or malformed, the application does not start.
 */
export class EnvironmentVariables {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsOptional()
  @IsIn(['development', 'production', 'test'])
  NODE_ENV: string = 'development';

  @IsString()
  @IsNotEmpty()
  @Matches(/^mongodb(\+srv)?:\/\/\S+$/, {
    message:
      'MONGODB_URI must be a MongoDB connection string (mongodb://... or mongodb+srv://...)',
  })
  MONGODB_URI: string;
}

/**
 * `validate` hook for ConfigModule.forRoot, also used by the seed script.
 * Returns the converted values (numbers are numbers, defaults are filled in)
 * or throws one error listing every problem.
 */
export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const env = plainToInstance(EnvironmentVariables, config);
  const errors = validateSync(env, { skipMissingProperties: false });
  if (errors.length > 0) {
    const details = errors
      .map((error) => {
        const reasons = Object.values(error.constraints ?? {}).join('; ');
        return `  - ${error.property}: ${reasons}`;
      })
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
  return env;
}
