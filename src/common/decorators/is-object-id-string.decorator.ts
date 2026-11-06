import { applyDecorators } from '@nestjs/common';
import { IsString, Matches } from 'class-validator';
import { OBJECT_ID_MESSAGE, OBJECT_ID_REGEX } from '../object-id';

/**
 * DTO field that carries an ObjectId as a string (body field or query
 * parameter). Only the form is checked here; whether the document exists is a
 * question for the service.
 */
export const IsObjectIdString = (): PropertyDecorator =>
  applyDecorators(
    IsString(),
    Matches(OBJECT_ID_REGEX, { message: `$property ${OBJECT_ID_MESSAGE}` }),
  );
