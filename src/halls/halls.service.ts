import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { isDuplicateKeyError } from '../common/mongo-errors';
import { toObjectId } from '../common/object-id';
import { Showing } from '../showings/schemas/showing.schema';
import { CreateHallDto } from './dto/create-hall.dto';
import { HallResponseDto, HallWithSeatsDto } from './dto/hall-response.dto';
import { Hall } from './schemas/hall.schema';

@Injectable()
export class HallsService {
  constructor(
    @InjectModel(Hall.name) private readonly hallModel: Model<Hall>,
    @InjectModel(Showing.name) private readonly showingModel: Model<Showing>,
  ) {}

  async create(dto: CreateHallDto): Promise<HallResponseDto> {
    try {
      const hall = await this.hallModel.create({
        name: dto.name,
        rows: dto.rows,
        seatsPerRow: dto.seatsPerRow,
      });
      return HallResponseDto.from(hall);
    } catch (error) {
      // The unique index on the name is the only judge: no read-then-write.
      if (isDuplicateKeyError(error)) {
        throw new ConflictException(
          `Hall with name "${dto.name}" already exists`,
        );
      }
      throw error;
    }
  }

  async findAll(): Promise<HallResponseDto[]> {
    const halls = await this.hallModel.find().sort({ _id: 1 }).lean().exec();
    return halls.map((hall) => HallResponseDto.from(hall));
  }

  async findOneWithSeats(id: string): Promise<HallWithSeatsDto> {
    const hall = await this.hallModel.findById(toObjectId(id)).lean().exec();
    if (!hall) throw this.notFound(id);
    return HallWithSeatsDto.withSeats(hall);
  }

  /**
   * MongoDB has no foreign keys, so the dependency is checked with a query:
   * a hall that a showing points to is not deleted (409).
   */
  async remove(id: string): Promise<void> {
    const objectId = toObjectId(id);
    if (!(await this.hallModel.exists({ _id: objectId }))) {
      throw this.notFound(id);
    }
    if (await this.showingModel.exists({ hall: objectId })) {
      throw new ConflictException(
        `Hall ${id} cannot be deleted: at least one showing references it`,
      );
    }
    const result = await this.hallModel.deleteOne({ _id: objectId });
    if (result.deletedCount === 0) throw this.notFound(id);
  }

  private notFound(id: string): NotFoundException {
    return new NotFoundException(`Hall with id ${id} not found`);
  }
}
