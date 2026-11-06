import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { toObjectId } from '../common/object-id';
import { Showing } from '../showings/schemas/showing.schema';
import { CreateFilmDto } from './dto/create-film.dto';
import { FilmResponseDto } from './dto/film-response.dto';
import { UpdateFilmDto } from './dto/update-film.dto';
import { Film } from './schemas/film.schema';

@Injectable()
export class FilmsService {
  constructor(
    @InjectModel(Film.name) private readonly filmModel: Model<Film>,
    @InjectModel(Showing.name) private readonly showingModel: Model<Showing>,
  ) {}

  async create(dto: CreateFilmDto): Promise<FilmResponseDto> {
    const film = await this.filmModel.create({
      title: dto.title,
      durationMinutes: dto.durationMinutes,
      releaseYear: dto.releaseYear,
    });
    return FilmResponseDto.from(film);
  }

  async findAll(): Promise<FilmResponseDto[]> {
    // ObjectIds grow with creation time, so sorting by _id is creation order.
    const films = await this.filmModel.find().sort({ _id: 1 }).lean().exec();
    return films.map((film) => FilmResponseDto.from(film));
  }

  async findOne(id: string): Promise<FilmResponseDto> {
    const film = await this.filmModel.findById(toObjectId(id)).lean().exec();
    if (!film) throw this.notFound(id);
    return FilmResponseDto.from(film);
  }

  async update(id: string, dto: UpdateFilmDto): Promise<FilmResponseDto> {
    const changes: Partial<Film> = {};
    if (dto.title !== undefined) changes.title = dto.title;
    if (dto.durationMinutes !== undefined) {
      changes.durationMinutes = dto.durationMinutes;
    }
    if (dto.releaseYear !== undefined) changes.releaseYear = dto.releaseYear;

    const objectId = toObjectId(id);
    const film =
      Object.keys(changes).length === 0
        ? await this.filmModel.findById(objectId).lean().exec()
        : await this.filmModel
            .findByIdAndUpdate(
              objectId,
              { $set: changes },
              { new: true, runValidators: true },
            )
            .lean()
            .exec();
    if (!film) throw this.notFound(id);
    return FilmResponseDto.from(film);
  }

  /**
   * MongoDB has no foreign keys, so the dependency is checked with a query:
   * a film that a showing points to is not deleted (409).
   */
  async remove(id: string): Promise<void> {
    const objectId = toObjectId(id);
    if (!(await this.filmModel.exists({ _id: objectId }))) {
      throw this.notFound(id);
    }
    if (await this.showingModel.exists({ film: objectId })) {
      throw new ConflictException(
        `Film ${id} cannot be deleted: at least one showing references it`,
      );
    }
    const result = await this.filmModel.deleteOne({ _id: objectId });
    if (result.deletedCount === 0) throw this.notFound(id);
  }

  private notFound(id: string): NotFoundException {
    return new NotFoundException(`Film with id ${id} not found`);
  }
}
