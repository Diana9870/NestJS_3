import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
import { CreateFilmDto } from './dto/create-film.dto';
import { FilmResponseDto } from './dto/film-response.dto';
import { UpdateFilmDto } from './dto/update-film.dto';
import { FilmsService } from './films.service';

@ApiTags('films')
@Controller('films')
export class FilmsController {
  constructor(private readonly filmsService: FilmsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a film' })
  @ApiCreatedResponse({ description: 'Film created', type: FilmResponseDto })
  @ApiBadRequestResponse({
    description: 'A field is missing or has a wrong type',
    type: ErrorResponseDto,
  })
  create(@Body() dto: CreateFilmDto): Promise<FilmResponseDto> {
    return this.filmsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all films' })
  @ApiOkResponse({
    description: 'Films, empty array if there are none',
    type: [FilmResponseDto],
  })
  findAll(): Promise<FilmResponseDto[]> {
    return this.filmsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one film' })
  @ApiObjectIdParam('Film id')
  @ApiOkResponse({ description: 'The film', type: FilmResponseDto })
  @ApiNotFoundResponse({
    description: 'No film with this id',
    type: ErrorResponseDto,
  })
  findOne(
    @Param('id', parseObjectIdPipe) id: string,
  ): Promise<FilmResponseDto> {
    return this.filmsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update any subset of the film fields' })
  @ApiObjectIdParam('Film id')
  @ApiOkResponse({ description: 'The updated film', type: FilmResponseDto })
  @ApiBadRequestResponse({
    description: 'A field has a wrong type',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No film with this id',
    type: ErrorResponseDto,
  })
  update(
    @Param('id', parseObjectIdPipe) id: string,
    @Body() dto: UpdateFilmDto,
  ): Promise<FilmResponseDto> {
    return this.filmsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a film' })
  @ApiObjectIdParam('Film id')
  @ApiNoContentResponse({ description: 'Film deleted' })
  @ApiNotFoundResponse({
    description: 'No film with this id',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description:
      'At least one showing references the film (checked with a query, MongoDB has no foreign keys)',
    type: ErrorResponseDto,
  })
  remove(@Param('id', parseObjectIdPipe) id: string): Promise<void> {
    return this.filmsService.remove(id);
  }
}
