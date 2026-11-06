import { ApiProperty } from '@nestjs/swagger';

/** Showing as returned by POST /showings: links a film and a hall by id. */
export class ShowingResponseDto {
  @ApiProperty({
    description: 'ObjectId as a string (24 hexadecimal characters)',
    example: '507f1f77bcf86cd799439013',
  })
  id: string;

  @ApiProperty({
    description: 'ObjectId of the film',
    example: '507f1f77bcf86cd799439011',
  })
  filmId: string;

  @ApiProperty({
    description: 'ObjectId of the hall',
    example: '507f1f77bcf86cd799439012',
  })
  hallId: string;

  @ApiProperty({
    description: 'Start of the showing, ISO 8601, UTC',
    example: '2099-01-01T18:00:00.000Z',
  })
  startsAt: string;

  @ApiProperty({
    description: 'Ticket price in kopiykas (12500 = 125 UAH)',
    example: 12500,
  })
  price: number;
}

/** Showing as returned by the read routes: names instead of ids. */
export class ShowingViewDto {
  @ApiProperty({
    description: 'ObjectId as a string (24 hexadecimal characters)',
    example: '507f1f77bcf86cd799439013',
  })
  id: string;

  @ApiProperty({ description: 'Title of the film', example: 'Dune: Part Two' })
  filmTitle: string;

  @ApiProperty({ description: 'Name of the hall', example: 'Hall 1' })
  hallName: string;

  @ApiProperty({
    description: 'Start of the showing, ISO 8601, UTC',
    example: '2099-01-01T18:00:00.000Z',
  })
  startsAt: string;

  @ApiProperty({
    description: 'Ticket price in kopiykas (12500 = 125 UAH)',
    example: 12500,
  })
  price: number;
}

/** One seat of the hall with its state on a particular showing. */
export class SeatAvailabilityDto {
  @ApiProperty({ description: 'Row number, starting from 1', example: 2 })
  row: number;

  @ApiProperty({
    description: 'Seat number in the row, starting from 1',
    example: 4,
  })
  seat: number;

  @ApiProperty({
    description: 'true if the seat has a bookingId on this showing',
    example: false,
  })
  isBooked: boolean;
}
