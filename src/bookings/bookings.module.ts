import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Hall, HallSchema } from '../halls/schemas/hall.schema';
import { Showing, ShowingSchema } from '../showings/schemas/showing.schema';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Showing.name, schema: ShowingSchema },
      // Registered because populate('hall') needs the Hall model on the connection.
      { name: Hall.name, schema: HallSchema },
    ]),
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
