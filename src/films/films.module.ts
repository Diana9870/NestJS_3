import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Showing, ShowingSchema } from '../showings/schemas/showing.schema';
import { FilmsController } from './films.controller';
import { FilmsService } from './films.service';
import { Film, FilmSchema } from './schemas/film.schema';

@Module({
  imports: [
    // Showing is needed only for the "film is still used" check on delete.
    MongooseModule.forFeature([
      { name: Film.name, schema: FilmSchema },
      { name: Showing.name, schema: ShowingSchema },
    ]),
  ],
  controllers: [FilmsController],
  providers: [FilmsService],
})
export class FilmsModule {}
