import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { OBJECT_ID_MESSAGE, isObjectIdString } from '../object-id';

/**
 * Route `:id` pipe. Checks only the FORM of the id (24 hex characters) and
 * runs before any database call. A malformed id is a 400 with an explanation
 * of the format; a well-formed id of a document that does not exist is a 404
 * produced later by the service.
 */
@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!isObjectIdString(value)) {
      throw new BadRequestException(
        `${metadata.data ?? 'id'} ${OBJECT_ID_MESSAGE}`,
      );
    }
    return value;
  }
}

export const parseObjectIdPipe = new ParseObjectIdPipe();
