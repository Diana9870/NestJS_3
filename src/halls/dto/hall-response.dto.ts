import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { SeatResponseDto } from '../../common/dto/seat.dto';
import { buildSeatLayout } from '../seat-layout';

interface HallLike {
  _id: Types.ObjectId;
  name: string;
  rows: number;
  seatsPerRow: number;
}

/** Hall as returned by the routes: `_id` is given out as the string `id`. */
export class HallResponseDto {
  @ApiProperty({
    description: 'ObjectId as a string (24 hexadecimal characters)',
    example: '507f1f77bcf86cd799439012',
  })
  id: string;

  @ApiProperty({ description: 'Unique among all halls', example: 'Hall 1' })
  name: string;

  @ApiProperty({ example: 3 })
  rows: number;

  @ApiProperty({ example: 5 })
  seatsPerRow: number;

  static from(hall: HallLike): HallResponseDto {
    const dto = new HallResponseDto();
    dto.id = hall._id.toString();
    dto.name = hall.name;
    dto.rows = hall.rows;
    dto.seatsPerRow = hall.seatsPerRow;
    return dto;
  }
}

/** Response of GET /halls/:id: the hall and its computed seat layout. */
export class HallWithSeatsDto extends HallResponseDto {
  @ApiProperty({
    description: 'Every seat of the hall, computed from rows x seatsPerRow',
    type: [SeatResponseDto],
  })
  seats: SeatResponseDto[];

  static withSeats(hall: HallLike): HallWithSeatsDto {
    const dto = new HallWithSeatsDto();
    dto.id = hall._id.toString();
    dto.name = hall.name;
    dto.rows = hall.rows;
    dto.seatsPerRow = hall.seatsPerRow;
    dto.seats = buildSeatLayout(hall.rows, hall.seatsPerRow);
    return dto;
  }
}
