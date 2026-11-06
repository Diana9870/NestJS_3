import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsISO8601, IsPositive, Matches, Max } from 'class-validator';
import { IsObjectIdString } from '../../common/decorators/is-object-id-string.decorator';

export class CreateShowingDto {
  @ApiProperty({
    description: 'Id of an existing film. ObjectId: 24 hexadecimal characters',
    example: '507f1f77bcf86cd799439011',
  })
  @IsObjectIdString()
  filmId: string;

  @ApiProperty({
    description: 'Id of an existing hall. ObjectId: 24 hexadecimal characters',
    example: '507f1f77bcf86cd799439012',
  })
  @IsObjectIdString()
  hallId: string;

  @ApiProperty({
    description:
      'ISO 8601 date and time, must be in the future. A value without an offset is read as UTC. It is stored as a UTC instant and returned in UTC.',
    example: '2099-01-01T18:00:00Z',
  })
  // Date AND time in the extended format (2099-01-01T18:00[:00][Z|+03:00]):
  // a bare date or the basic format (20990101T180000Z) is rejected.
  @Matches(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/i,
    {
      message:
        'startsAt must be an ISO 8601 date and time, e.g. 2099-01-01T18:00:00Z',
    },
  )
  @IsISO8601({ strict: true, strictSeparator: true })
  startsAt: string;

  @ApiProperty({
    description:
      'Ticket price in kopiykas, a positive integer (12500 = 125 UAH)',
    example: 12500,
    minimum: 1,
    maximum: 2147483647,
  })
  @IsInt()
  @IsPositive()
  @Max(2_147_483_647)
  price: number;
}
