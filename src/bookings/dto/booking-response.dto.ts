import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { SeatResponseDto } from '../../common/dto/seat.dto';

interface BookingLike {
  _id: Types.ObjectId;
  seats: Array<{ row: number; seat: number }>;
  totalPrice: number;
  createdAt: Date;
}

/** Booking as returned by the routes: the seats are listed inside it. */
export class BookingResponseDto {
  @ApiProperty({
    description: 'ObjectId of the booking as a string',
    example: '507f1f77bcf86cd799439014',
  })
  id: string;

  @ApiProperty({
    description: 'ObjectId of the showing the booking belongs to',
    example: '507f1f77bcf86cd799439013',
  })
  showingId: string;

  @ApiProperty({
    description: 'Booked seats, ordered by row and seat',
    type: [SeatResponseDto],
  })
  seats: SeatResponseDto[];

  @ApiProperty({
    description: 'Showing price multiplied by the number of seats, in kopiykas',
    example: 25000,
  })
  totalPrice: number;

  @ApiProperty({
    description: 'When the booking was made, ISO 8601, UTC',
    example: '2099-01-01T10:00:00.000Z',
  })
  createdAt: string;

  static from(showingId: Types.ObjectId, booking: BookingLike): BookingResponseDto {
    const dto = new BookingResponseDto();
    dto.id = booking._id.toString();
    dto.showingId = showingId.toString();
    dto.seats = booking.seats
      .map(({ row, seat }) => ({ row, seat }))
      .sort((a, b) => a.row - b.row || a.seat - b.seat);
    dto.totalPrice = booking.totalPrice;
    dto.createdAt = booking.createdAt.toISOString();
    return dto;
  }
}
