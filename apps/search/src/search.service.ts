import { BadRequestException, Injectable } from '@nestjs/common';
import { Search, SearchDocument } from './search/search.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductCreatedDto } from './events/product-events.dto';
import { SearchQueryDto } from './search/search-query.dto';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Search.name)
    private readonly searchModel: Model<SearchDocument>,
  ) {}

  normalisedText(input: { name: string; description: string }) {
    return `${input.name}: ${input.description}`.toLowerCase();
  }

  async upsertFromProductCreation(input: ProductCreatedDto) {
    const normalisedText = this.normalisedText({
      name: input.name,
      description: input.description,
    });

    await this.searchModel.findOneAndUpdate(
      { productId: input.productId },
      {
        $set: {
          name: input.name,
          normalisedText,
          status: input.status,
          price: input.price,
        },
        $setOnInsert: {
          productId: input.productId,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  async query(input: SearchQueryDto) {
    const query = (input.query ?? '').toLowerCase();

    if (query.length < 3) {
      return {
        products: [],
        pagination: {
          page: input.page ?? 1,
          limit: input.limit ?? 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }

    const page = input.page ?? 1;
    const limit = Math.min(Math.max(input.limit ?? 10, 1), 20);
    const skip = (page - 1) * limit;

    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const [products, total] = await Promise.all([
      this.searchModel
        .find({
          $or: [
            { name: { $regex: regex } },
            { normalisedText: { $regex: regex } },
          ],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.searchModel
        .countDocuments({
          $or: [
            { name: { $regex: regex } },
            { normalisedText: { $regex: regex } },
          ],
        })
        .exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  //health
  ping() {
    return {
      status: 'Ok',
      service: 'search',
      now: new Date().toLocaleDateString(),
    };
  }
}
