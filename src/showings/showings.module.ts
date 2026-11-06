import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Film, FilmSchema } from '../films/schemas/film.schema';
import { Hall, HallSchema } from '../halls/schemas/hall.schema';
import { Showing, ShowingSchema } from './schemas/showing.schema';
import { ShowingsController } from './showings.controller';
import { ShowingsService } from './showings.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Showing.name, schema: ShowingSchema },
      { name: Film.name, schema: FilmSchema },
      { name: Hall.name, schema: HallSchema },
    ]),
  ],
  controllers: [ShowingsController],
  providers: [ShowingsService],
})
export class ShowingsModule {}
