import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * Collection `halls`. The seat layout is not stored: it is computed from
 * `rows` and `seatsPerRow` (see `halls/seat-layout.ts`).
 */
@Schema({ collection: 'halls', versionKey: false })
export class Hall {
  @Prop({ type: String, required: true, trim: true })
  name: string;

  @Prop({ type: Number, required: true })
  rows: number;

  @Prop({ type: Number, required: true })
  seatsPerRow: number;
}

export type HallDocument = HydratedDocument<Hall>;
export const HallSchema = SchemaFactory.createForClass(Hall);

/**
 * Unique index on the hall name. The collation (strength 2) makes it ignore
 * case, so "Hall 1" and "hall 1" are the same name, as in the previous
 * version of the service. A duplicate is rejected by the database itself
 * (error 11000), which also covers two concurrent requests.
 */
HallSchema.index(
  { name: 1 },
  {
    unique: true,
    name: 'UQ_halls_name',
    collation: { locale: 'en', strength: 2 },
  },
);
