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
import { CreateHallDto } from './dto/create-hall.dto';
import { HallResponseDto, HallWithSeatsDto } from './dto/hall-response.dto';
import { HallsService } from './halls.service';

@ApiTags('halls')
@Controller('halls')
export class HallsController {
  constructor(private readonly hallsService: HallsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a hall' })
  @ApiCreatedResponse({ description: 'Hall created', type: HallResponseDto })
  @ApiBadRequestResponse({
    description:
      'A field is missing, has a wrong type, or a number is not a positive integer',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'A hall with this name already exists',
    type: ErrorResponseDto,
  })
  create(@Body() dto: CreateHallDto): Promise<HallResponseDto> {
    return this.hallsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all halls' })
  @ApiOkResponse({
    description: 'Halls, empty array if there are none',
    type: [HallResponseDto],
  })
  findAll(): Promise<HallResponseDto[]> {
    return this.hallsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one hall together with its seats' })
  @ApiObjectIdParam('Hall id')
  @ApiOkResponse({
    description: 'The hall with the `seats` array (rows x seatsPerRow items)',
    type: HallWithSeatsDto,
  })
  @ApiNotFoundResponse({
    description: 'No hall with this id',
    type: ErrorResponseDto,
  })
  findOne(
    @Param('id', parseObjectIdPipe) id: string,
  ): Promise<HallWithSeatsDto> {
    return this.hallsService.findOneWithSeats(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a hall' })
  @ApiObjectIdParam('Hall id')
  @ApiNoContentResponse({ description: 'Hall deleted' })
  @ApiNotFoundResponse({
    description: 'No hall with this id',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description:
      'At least one showing references the hall (checked with a query, MongoDB has no foreign keys)',
    type: ErrorResponseDto,
  })
  remove(@Param('id', parseObjectIdPipe) id: string): Promise<void> {
    return this.hallsService.remove(id);
  }
}
