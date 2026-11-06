import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiObjectIdParam } from '../common/decorators/api-object-id-param.decorator';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { parseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { BookingsService } from './bookings.service';
import { BookingResponseDto } from './dto/booking-response.dto';
import { CreateBookingDto } from './dto/create-booking.dto';

/**
 * No path prefix on purpose: bookings own routes under both /bookings and
 * /showings/:id. The bookings live inside showing documents.
 */
@ApiTags('bookings')
@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('bookings')
  @ApiOperation({
    summary: 'List all bookings of the service',
    description: 'The bookings are collected from the showing documents.',
  })
  @ApiOkResponse({
    description: 'Bookings, empty array if there are none',
    type: [BookingResponseDto],
  })
  findAll(): Promise<BookingResponseDto[]> {
    return this.bookingsService.findAll();
  }

  @Post('showings/:id/bookings')
  @ApiOperation({
    summary: 'Book seats on a showing',
    description:
      'All-or-nothing: the seats get their bookingId and the booking is added to the showing in ONE update of the showing document, which succeeds only if every requested seat is free. Otherwise nothing is changed.',
  })
  @ApiObjectIdParam('Showing id')
  @ApiCreatedResponse({
    description: 'Booking created; totalPrice = showing price x number of seats',
    type: BookingResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'The showing id is not a valid ObjectId, seats is empty, an item lacks row or seat, a seat is repeated, a number is not a positive integer, or a seat is outside the hall',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No showing with this id',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description:
      'At least one requested seat is already booked on this showing; nothing is changed',
    type: ErrorResponseDto,
  })
  create(
    @Param('id', parseObjectIdPipe) showingId: string,
    @Body() dto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.create(showingId, dto);
  }

  @Get('showings/:id/bookings')
  @ApiOperation({ summary: 'List bookings of one showing' })
  @ApiObjectIdParam('Showing id')
  @ApiOkResponse({
    description: 'Bookings of the showing',
    type: [BookingResponseDto],
  })
  @ApiNotFoundResponse({
    description: 'No showing with this id',
    type: ErrorResponseDto,
  })
  findByShowing(
    @Param('id', parseObjectIdPipe) showingId: string,
  ): Promise<BookingResponseDto[]> {
    return this.bookingsService.findByShowing(showingId);
  }

  @Delete('bookings/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Cancel a booking',
    description:
      'The showing is found by the embedded booking; its seats are freed and the booking is removed in one update.',
  })
  @ApiObjectIdParam('Booking id')
  @ApiNoContentResponse({ description: 'Booking cancelled' })
  @ApiNotFoundResponse({
    description: 'No showing contains a booking with this id',
    type: ErrorResponseDto,
  })
  remove(@Param('id', parseObjectIdPipe) id: string): Promise<void> {
    return this.bookingsService.remove(id);
  }
}
