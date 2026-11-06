import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { toObjectId } from '../common/object-id';
import { Film } from '../films/schemas/film.schema';
import { Hall } from '../halls/schemas/hall.schema';
import { buildSeatLayout } from '../halls/seat-layout';
import { CreateShowingDto } from './dto/create-showing.dto';
import { PaginatedShowingsDto } from './dto/paginated-showings.dto';
import { QueryShowingsDto } from './dto/query-showings.dto';
import {
  SeatAvailabilityDto,
  ShowingResponseDto,
  ShowingViewDto,
} from './dto/showing-response.dto';
import { Showing, ShowingSeat } from './schemas/showing.schema';

const DAY_MS = 86_400_000;

/**
 * Parses an ISO 8601 date-time to epoch ms. A value without an offset
 * (2099-01-01T18:00:00) is read as UTC, never in the server's local zone.
 */
function parseStartsAt(value: string): number {
  const hasOffset = /(Z|[+-]\d{2}(:?\d{2})?)$/i.test(value.split('T')[1] ?? '');
  const isDateTime = value.includes('T');
  return Date.parse(isDateTime && !hasOffset ? `${value}Z` : value);
}

/** A showing without its embedded arrays, film and hall populated by name. */
interface ShowingRow {
  _id: Types.ObjectId;
  film: { title: string } | null;
  hall: { name: string } | null;
  startsAt: Date;
  price: number;
}

@Injectable()
export class ShowingsService {
  constructor(
    @InjectModel(Showing.name) private readonly showingModel: Model<Showing>,
    @InjectModel(Film.name) private readonly filmModel: Model<Film>,
    @InjectModel(Hall.name) private readonly hallModel: Model<Hall>,
  ) {}

  /**
   * Creates a showing and fills its `seats` from the hall: rows x seatsPerRow
   * elements, every bookingId null. `bookings` starts empty.
   */
  async create(dto: CreateShowingDto): Promise<ShowingResponseDto> {
    const filmId = toObjectId(dto.filmId);
    const hallId = toObjectId(dto.hallId);

    if (!(await this.filmModel.exists({ _id: filmId }))) {
      throw new BadRequestException(`Film with id ${dto.filmId} not found`);
    }
    const hall = await this.hallModel.findById(hallId).lean().exec();
    if (!hall) {
      throw new BadRequestException(`Hall with id ${dto.hallId} not found`);
    }

    const startsAtMs = parseStartsAt(dto.startsAt);
    if (Number.isNaN(startsAtMs)) {
      throw new BadRequestException(
        'startsAt is not a valid ISO 8601 date and time',
      );
    }
    if (startsAtMs <= Date.now()) {
      throw new BadRequestException('startsAt must not be in the past');
    }

    const seats = buildSeatLayout(hall.rows, hall.seatsPerRow).map((seat) => ({
      row: seat.row,
      seat: seat.seat,
      bookingId: null,
    }));

    const showing = await this.showingModel.create({
      film: filmId,
      hall: hallId,
      startsAt: new Date(startsAtMs),
      price: dto.price,
      seats,
      bookings: [],
    });

    // Built field by field: the embedded arrays are not part of the answer.
    return {
      id: showing._id.toString(),
      filmId: filmId.toString(),
      hallId: hallId.toString(),
      startsAt: showing.startsAt.toISOString(),
      price: showing.price,
    };
  }

  /**
   * One page of the schedule. Filtering, ordering, counting and cutting out
   * the page are all done by the database: the query carries the filter,
   * sort, skip and limit, and the embedded arrays are excluded by projection,
   * so only the light rows of one page are loaded.
   */
  async findAll(query: QueryShowingsDto): Promise<PaginatedShowingsDto> {
    const { filmId, date, page = 1, limit = 20, sort = 'asc' } = query;

    const filter: FilterQuery<Showing> = {};
    if (filmId !== undefined) {
      filter.film = toObjectId(filmId);
    }
    if (date !== undefined) {
      // The day is a UTC day: [00:00:00Z of date, 00:00:00Z of the next day).
      const from = new Date(`${date}T00:00:00.000Z`);
      const to = new Date(from.getTime() + DAY_MS);
      filter.startsAt = { $gte: from, $lt: to };
    }

    const [rows, total] = await Promise.all([
      this.showingModel
        .find(filter, { seats: 0, bookings: 0 })
        .sort({ startsAt: sort === 'desc' ? -1 : 1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('film', 'title')
        .populate('hall', 'name')
        .lean<ShowingRow[]>()
        .exec(),
      this.showingModel.countDocuments(filter).exec(),
    ]);

    return {
      items: rows.map((row) => this.toView(row)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<ShowingViewDto> {
    const row = await this.showingModel
      .findById(toObjectId(id), { seats: 0, bookings: 0 })
      .populate('film', 'title')
      .populate('hall', 'name')
      .lean<ShowingRow>()
      .exec();
    if (!row) throw this.notFound(id);
    return this.toView(row);
  }

  /** The seat map: every seat of the hall, isBooked is derived from bookingId. */
  async getSeats(id: string): Promise<SeatAvailabilityDto[]> {
    const showing = await this.showingModel
      .findById(toObjectId(id), { seats: 1 })
      .lean<{ seats: ShowingSeat[] }>()
      .exec();
    if (!showing) throw this.notFound(id);
    return showing.seats.map((seat) => ({
      row: seat.row,
      seat: seat.seat,
      isBooked: seat.bookingId !== null && seat.bookingId !== undefined,
    }));
  }

  private toView(row: ShowingRow): ShowingViewDto {
    return {
      id: row._id.toString(),
      filmTitle: row.film?.title ?? '',
      hallName: row.hall?.name ?? '',
      startsAt: row.startsAt.toISOString(),
      price: row.price,
    };
  }

  private notFound(id: string): NotFoundException {
    return new NotFoundException(`Showing with id ${id} not found`);
  }
}
