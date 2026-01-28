import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SearchDocument = HydratedDocument<Search>;

@Schema({ timestamps: true })
export class Search {
  @Prop({ required: true, unique: true, index: true })
  productId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  normalisedText: string;

  @Prop({ required: true, enum: ['DRAFT', 'ACTIVE'] })
  status: 'DRAFT' | 'ACTIVE';

  @Prop({ required: true })
  price: number;
}

export const SearchSchema = SchemaFactory.createForClass(Search);
