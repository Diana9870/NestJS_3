import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import mongoose, { Types } from 'mongoose';
import { validateEnv } from './config/env.validation';
import { Film, FilmSchema } from './films/schemas/film.schema';
import { Hall, HallSchema } from './halls/schemas/hall.schema';
import { buildSeatLayout } from './halls/seat-layout';
import { Showing, ShowingSchema } from './showings/schemas/showing.schema';

/**
 * Fills an empty database with data for a manual check: 2 films, 2 halls,
 * 4 showings on different dates, 1 booking.
 *
 * Idempotent: every document has a fixed _id and is written with an upsert
 * that only sets fields on insert ($setOnInsert), so a second run changes
 * nothing and creates no duplicates. Halls are matched by name first (the
 * name is unique), so a hall that already exists under that name is reused.
 */

const FILM_DUNE = new Types.ObjectId('650000000000000000000001');
const FILM_ARRIVAL = new Types.ObjectId('650000000000000000000002');
const HALL_BIG = new Types.ObjectId('650000000000000000000011');
const HALL_SMALL = new Types.ObjectId('650000000000000000000012');
const SHOWING_1 = new Types.ObjectId('650000000000000000000021');
const SHOWING_2 = new Types.ObjectId('650000000000000000000022');
const SHOWING_3 = new Types.ObjectId('650000000000000000000023');
const SHOWING_4 = new Types.ObjectId('650000000000000000000024');
const BOOKING_1 = new Types.ObjectId('650000000000000000000031');

/** `days` days from today at `hour`:00 UTC. */
function startsAt(days: number, hour: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
}

async function seed(): Promise<void> {
  loadEnv();
  const env = validateEnv(process.env);
  await mongoose.connect(env.MONGODB_URI);

  try {
    const filmModel = mongoose.model(Film.name, FilmSchema);
    const hallModel = mongoose.model(Hall.name, HallSchema);
    const showingModel = mongoose.model(Showing.name, ShowingSchema);
    // Builds the indexes (the unique hall name) before the first write.
    await Promise.all([
      filmModel.init(),
      hallModel.init(),
      showingModel.init(),
    ]);

    await filmModel.bulkWrite([
      {
        updateOne: {
          filter: { _id: FILM_DUNE },
          update: {
            $setOnInsert: {
              title: 'Dune: Part Two',
              durationMinutes: 166,
              releaseYear: 2024,
            },
          },
          upsert: true,
        },
      },
      {
        updateOne: {
          filter: { _id: FILM_ARRIVAL },
          update: {
            $setOnInsert: {
              title: 'Arrival',
              durationMinutes: 116,
              releaseYear: 2016,
            },
          },
          upsert: true,
        },
      },
    ]);

    // Name first: a hall called "Hall 1" that already exists is reused.
    const ensureHall = async (
      id: Types.ObjectId,
      name: string,
      rows: number,
      seatsPerRow: number,
    ) => {
      const existing = await hallModel
        .findOne({ name })
        .collation({ locale: 'en', strength: 2 })
        .lean()
        .exec();
      if (existing) return existing;
      await hallModel.updateOne(
        { _id: id },
        { $setOnInsert: { name, rows, seatsPerRow } },
        { upsert: true },
      );
      return hallModel.findById(id).lean().orFail().exec();
    };
    const big = await ensureHall(HALL_BIG, 'Hall 1', 8, 12);
    const small = await ensureHall(HALL_SMALL, 'Hall 2', 3, 5);

    const seatsOf = (hall: { rows: number; seatsPerRow: number }) =>
      buildSeatLayout(hall.rows, hall.seatsPerRow).map((seat) => ({
        ...seat,
        bookingId: null as Types.ObjectId | null,
      }));
    const showingDoc = (
      film: Types.ObjectId,
      hall: { _id: Types.ObjectId; rows: number; seatsPerRow: number },
      days: number,
      hour: number,
      price: number,
    ) => ({
      film,
      hall: hall._id,
      startsAt: startsAt(days, hour),
      price,
      seats: seatsOf(hall),
      bookings: [] as unknown[],
    });

    // The booking is part of the first showing: two seats of row 4 hold its
    // id in seats[].bookingId and the booking sits in bookings[] with the
    // same coordinates. It is written together with the showing, once.
    const first = showingDoc(FILM_DUNE, big, 1, 18, 25000);
    const bookedSeats = [
      { row: 4, seat: 6 },
      { row: 4, seat: 7 },
    ];
    for (const seat of first.seats) {
      if (bookedSeats.some((b) => b.row === seat.row && b.seat === seat.seat)) {
        seat.bookingId = BOOKING_1;
      }
    }
    first.bookings.push({
      _id: BOOKING_1,
      seats: bookedSeats,
      totalPrice: 2 * first.price,
      createdAt: new Date(),
    });

    const showings: Array<[Types.ObjectId, Record<string, unknown>]> = [
      [SHOWING_1, first],
      [SHOWING_2, showingDoc(FILM_DUNE, small, 2, 12, 18000)],
      [SHOWING_3, showingDoc(FILM_ARRIVAL, big, 3, 20, 22000)],
      [SHOWING_4, showingDoc(FILM_ARRIVAL, small, 7, 15, 15000)],
    ];
    await showingModel.bulkWrite(
      showings.map(([id, doc]) => ({
        updateOne: {
          filter: { _id: id },
          update: { $setOnInsert: doc },
          upsert: true,
        },
      })),
    );

    const bookings = await showingModel.aggregate<{ count: number }>([
      { $project: { count: { $size: '$bookings' } } },
      { $group: { _id: null, count: { $sum: '$count' } } },
    ]);
    console.log('Seed done. Documents in the database:', {
      films: await filmModel.countDocuments(),
      halls: await hallModel.countDocuments(),
      showings: await showingModel.countDocuments(),
      bookings: bookings[0]?.count ?? 0,
    });
  } finally {
    await mongoose.disconnect();
  }
}

seed().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});
