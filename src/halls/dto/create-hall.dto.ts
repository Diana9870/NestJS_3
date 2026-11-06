import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  Max,
  MaxLength,
} from 'class-validator';
import { trimString } from '../../common/transforms';

/**
 * The seats of a hall are copied into every showing of that hall, so the size
 * is capped: 100 x 100 = 10 000 seats is far below the 16 MB document limit.
 */
export const MAX_HALL_ROWS = 100;
export const MAX_SEATS_PER_ROW = 100;

export class CreateHallDto {
  @ApiProperty({
    description: 'Must be unique among all halls (case-insensitive)',
    example: 'Hall 1',
    maxLength: 100,
  })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Number of rows, a positive integer',
    example: 3,
    minimum: 1,
    maximum: MAX_HALL_ROWS,
  })
  @IsInt()
  @IsPositive()
  @Max(MAX_HALL_ROWS)
  rows: number;

  @ApiProperty({
    description: 'Seats in every row, a positive integer',
    example: 5,
    minimum: 1,
    maximum: MAX_SEATS_PER_ROW,
  })
  @IsInt()
  @IsPositive()
  @Max(MAX_SEATS_PER_ROW)
  seatsPerRow: number;
}
