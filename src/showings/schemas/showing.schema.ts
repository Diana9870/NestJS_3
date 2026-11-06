import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

/**
 * Collections are referenced by model name. Plain strings (not the classes)
 * keep this file free of imports from the films and halls modules.
 */
export const FILM_MODEL = 'Film';
export const HALL_MODEL = 'Hall';

/** One seat of the hall, embedded in the showing. Free while bookingId is null. */
@Schema({ _id: false, versionKey: false })
export class ShowingSeat {
  @Prop({ type: Number, required: true })
  row: number;

  @Prop({ type: Number, required: true })
  seat: number;

  /** `_id` of the element of `Showing.bookings` that holds the seat, or null. */
  @Prop({ type: MongooseSchema.Types.ObjectId, default: null })
  bookingId: Types.ObjectId | null;
}
export const ShowingSeatSchema = SchemaFactory.createForClass(ShowingSeat);

/** A seat as it is listed inside a booking: just its coordinates. */
@Schema({ _id: false, versionKey: false })
export class BookedSeat {
  @Prop({ type: Number, required: true })
  row: number;

  @Prop({ type: Number, required: true })
  seat: number;
}
export const BookedSeatSchema = SchemaFactory.createForClass(BookedSeat);

/**
 * A booking, embedded in the showing. Its `_id` is generated in the code
 * before the write (the same value goes into `seats.$[].bookingId`), so the
 * schema keeps the default `_id` and the code passes its own value.
 */
@Schema({ versionKey: false })
export class ShowingBooking {
  _id: Types.ObjectId;

  /** Duplicates what `Showing.seats` shows; `seats` stays the source of truth. */
  @Prop({ type: [BookedSeatSchema], required: true })
  seats: BookedSeat[];

  /** In kopiykas: showing price x number of seats. */
  @Prop({ type: Number, required: true })
  totalPrice: number;

  @Prop({ type: Date, required: true })
  createdAt: Date;
}
export const ShowingBookingSchema =
  SchemaFactory.createForClass(ShowingBooking);

/**
 * Collection `showings`. The seats and the bookings of the showing are
 * embedded: their number is bounded by the size of the hall, and keeping them
 * in the same document is what lets a booking be one atomic update.
 */
@Schema({ collection: 'showings', versionKey: false })
export class Showing {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: FILM_MODEL, required: true })
  film: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: HALL_MODEL, required: true })
  hall: Types.ObjectId;

  @Prop({ type: Date, required: true })
  startsAt: Date;

  /** Ticket price in kopiykas (12500 = 125 UAH), an integer. */
  @Prop({ type: Number, required: true })
  price: number;

  @Prop({ type: [ShowingSeatSchema], default: [] })
  seats: ShowingSeat[];

  @Prop({ type: [ShowingBookingSchema], default: [] })
  bookings: ShowingBooking[];
}

export type ShowingDocument = HydratedDocument<Showing>;
export const ShowingSchema = SchemaFactory.createForClass(Showing);

// Sorting and paging of the schedule: ORDER BY startsAt, _id.
ShowingSchema.index({ startsAt: 1, _id: 1 });
// Filter by film, and the "is the film used" check on delete.
ShowingSchema.index({ film: 1 });
// The "is the hall used" check on delete.
ShowingSchema.index({ hall: 1 });
// DELETE /bookings/:id finds the showing by the embedded booking.
ShowingSchema.index({ 'bookings._id': 1 });
