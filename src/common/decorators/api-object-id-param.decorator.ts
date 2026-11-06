import { applyDecorators } from '@nestjs/common';
import { ApiBadRequestResponse, ApiParam } from '@nestjs/swagger';
import { ErrorResponseDto } from '../dto/error-response.dto';

/**
 * Swagger description of a route parameter that is an ObjectId: its format
 * and the 400 answer for a malformed value.
 */
export const ApiObjectIdParam = (
  description = 'Document id',
  name = 'id',
): MethodDecorator =>
  applyDecorators(
    ApiParam({
      name,
      description: `${description}. ObjectId: 24 hexadecimal characters`,
      schema: {
        type: 'string',
        pattern: '^[0-9a-fA-F]{24}$',
        example: '507f1f77bcf86cd799439011',
      },
    }),
    ApiBadRequestResponse({
      description:
        'The id is not a valid ObjectId (24 hexadecimal characters); the database is not queried',
      type: ErrorResponseDto,
    }),
  );
