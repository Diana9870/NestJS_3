import { ApiProperty } from '@nestjs/swagger';

/** Shape of every error body, produced by the global AllExceptionsFilter. */
export class ErrorResponseDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({
    description:
      'Reason of the error: a string, or a list of validation messages',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'Film with id 507f1f77bcf86cd799439011 not found',
  })
  message: string | string[];

  @ApiProperty({
    description: 'Path of the request that failed',
    example: '/films/507f1f77bcf86cd799439011',
  })
  path: string;
}
