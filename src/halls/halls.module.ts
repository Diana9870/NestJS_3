import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Showing, ShowingSchema } from '../showings/schemas/showing.schema';
import { HallsController } from './halls.controller';
import { HallsService } from './halls.service';
import { Hall, HallSchema } from './schemas/hall.schema';

@Module({
  imports: [
    // Showing is needed only for the "hall is still used" check on delete.
    MongooseModule.forFeature([
      { name: Hall.name, schema: HallSchema },
      { name: Showing.name, schema: ShowingSchema },
    ]),
  ],
  controllers: [HallsController],
  providers: [HallsService],
})
export class HallsModule {}
