import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

/** Film as returned by the routes: `_id` is given out as the string `id`. */
export class FilmResponseDto {
  @ApiProperty({
    description: 'ObjectId as a string (24 hexadecimal characters)',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({ example: 'Dune: Part Two' })
  title: string;

  @ApiProperty({ description: 'Duration in minutes', example: 166 })
  durationMinutes: number;

  @ApiProperty({ example: 2024 })
  releaseYear: number;

  static from(film: {
    _id: Types.ObjectId;
    title: string;
    durationMinutes: number;
    releaseYear: number;
  }): FilmResponseDto {
    const dto = new FilmResponseDto();
    dto.id = film._id.toString();
    dto.title = film.title;
    dto.durationMinutes = film.durationMinutes;
    dto.releaseYear = film.releaseYear;
    return dto;
  }
}
