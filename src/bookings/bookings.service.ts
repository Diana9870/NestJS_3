import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { toObjectId } from '../common/object-id';
import {
  Showing,
  ShowingBooking,
} from '../showings/schemas/showing.schema';
import { BookingResponseDto } from './dto/booking-response.dto';
import { CreateBookingDto } from './dto/create-booking.dto';

/** What the booking needs from a showing: its price and the size of its hall. */
interface ShowingForBooking {
  price: number;
  hall: { name: string; rows: number; seatsPerRow: number } | null;
}

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Showing.name) private readonly showingModel: Model<Showing>,
  ) {}

  /**
   * Books all seats of the request or none of them, with ONE update of the
   * showing document:
   *
   * - the filter requires every requested seat to exist in `seats` with
   *   bookingId null ($and of $elemMatch, one per seat);
   * - `$set` with arrayFilters puts the new bookingId into those seat elements
   *   and `$push` adds the booking to `bookings`, in the same operation.
   *
   * A single-document update is atomic, so two parallel requests for the same
   * seat run one after the other and the second one matches nothing
   * (matchedCount 0 -> 409). There is no read-check-write in the code.
   *
   * What the filter cannot tell apart is checked BEFORE the update: whether
   * the showing exists (404), whether every seat lies inside the hall (400,
   * otherwise a seat outside the hall would look like a taken one and give
   * 409), and that no seat is repeated (done by the DTO).
   */
  async create(
    showingId: string,
    dto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    const showingObjectId = toObjectId(showingId);

    // Light read for validation only: price and hall size, not the seats.
    const showing = await this.showingModel
      .findById(showingObjectId, { price: 1, hall: 1 })
      .populate('hall', 'name rows seatsPerRow')
      .lean<ShowingForBooking>()
      .exec();
    if (!showing) throw this.showingNotFound(showingId);

    const hall = showing.hall;
    if (!hall) {
      throw new NotFoundException(
        `Hall of showing ${showingId} not found`,
      );
    }
    for (const { row, seat } of dto.seats) {
      if (row > hall.rows || seat > hall.seatsPerRow) {
        throw new BadRequestException(
          `Seat (row ${row}, seat ${seat}) does not exist in hall "${hall.name}": ${hall.rows} rows, ${hall.seatsPerRow} seats per row`,
        );
      }
    }

    const bookingId = new Types.ObjectId();
    const totalPrice = showing.price * dto.seats.length;
    const seats = dto.seats.map(({ row, seat }) => ({ row, seat }));
    const createdAt = new Date();

    const result = await this.showingModel.updateOne(
      {
        _id: showingObjectId,
        $and: seats.map(({ row, seat }) => ({
          seats: { $elemMatch: { row, seat, bookingId: null } },
        })),
      },
      {
        $set: { 'seats.$[target].bookingId': bookingId },
        $push: {
          bookings: { _id: bookingId, seats, totalPrice, createdAt },
        },
      },
      {
        arrayFilters: [
          {
            $or: seats.map(({ row, seat }) => ({
              'target.row': row,
              'target.seat': seat,
            })),
          },
        ],
      },
    );

    // The showing exists and the seats are inside the hall (checked above),
    // so no match can only mean that a seat is already taken.
    if (result.matchedCount === 0) {
      throw new ConflictException(
        'One or more of the requested seats are already booked on this showing',
      );
    }

    return BookingResponseDto.from(showingObjectId, {
      _id: bookingId,
      seats,
      totalPrice,
      createdAt,
    });
  }

  /** All bookings of the service, collected from the showing documents. */
  async findAll(): Promise<BookingResponseDto[]> {
    const rows = await this.showingModel
      .aggregate<{ showingId: Types.ObjectId; booking: ShowingBooking }>([
        { $match: { 'bookings.0': { $exists: true } } },
        { $unwind: '$bookings' },
        { $sort: { 'bookings.createdAt': 1, 'bookings._id': 1 } },
        { $project: { _id: 0, showingId: '$_id', booking: '$bookings' } },
      ])
      .exec();
    return rows.map((row) => BookingResponseDto.from(row.showingId, row.booking));
  }

  async findByShowing(showingId: string): Promise<BookingResponseDto[]> {
    const showingObjectId = toObjectId(showingId);
    const showing = await this.showingModel
      .findById(showingObjectId, { bookings: 1 })
      .lean<{ bookings: ShowingBooking[] }>()
      .exec();
    if (!showing) throw this.showingNotFound(showingId);
    return showing.bookings.map((booking) =>
      BookingResponseDto.from(showingObjectId, booking),
    );
  }

  /**
   * Cancels a booking with ONE update. The booking id holds no reference to a
   * showing, so the showing is found by the embedded booking. `$set` frees
   * the seats that carry this bookingId, `$pull` removes the booking.
   */
  async remove(id: string): Promise<void> {
    const bookingId = toObjectId(id);
    const result = await this.showingModel.updateOne(
      { 'bookings._id': bookingId },
      {
        $set: { 'seats.$[target].bookingId': null },
        $pull: { bookings: { _id: bookingId } },
      },
      { arrayFilters: [{ 'target.bookingId': bookingId }] },
    );
    if (result.matchedCount === 0) {
      throw new NotFoundException(`Booking with id ${id} not found`);
    }
  }

  private showingNotFound(id: string): NotFoundException {
    return new NotFoundException(`Showing with id ${id} not found`);
  }
}
