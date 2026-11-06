import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

/**
 * Strict ObjectId format: exactly 24 hexadecimal characters. Mongoose's own
 * `isValidObjectId` also accepts any 12-character string, which is not what
 * the API promises, so the format is checked with this pattern instead.
 */
export const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

export const OBJECT_ID_MESSAGE =
  'must be a valid ObjectId: a string of 24 hexadecimal characters, e.g. 507f1f77bcf86cd799439011';

export const isObjectIdString = (value: unknown): value is string =>
  typeof value === 'string' && OBJECT_ID_REGEX.test(value);

/**
 * Turns an id that already passed the format check into an ObjectId. Services
 * call it at the border between "string from the API" and "value for a query".
 */
export function toObjectId(id: string): Types.ObjectId {
  if (!isObjectIdString(id)) {
    throw new BadRequestException(`id ${OBJECT_ID_MESSAGE}`);
  }
  return new Types.ObjectId(id);
}
