import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductCreatedDto } from './events/product-events.dto';
import { SearchQueryDto } from './search/search-query.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Search, SearchDocument } from './search/search.schema';
import type { Cache } from 'cache-manager';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectModel(Search.name)
    private readonly searchModel: Model<SearchDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  normalisedText(input: { name: string; description: string }) {
    return `${input.name}: ${input.description}`.toLowerCase();
  }

  //upsert product in search index
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
    this.logger.log(`Search index upserted for product: ${input.productId}`);
  }

  //delete product from search index
  async deleteByProductId(productId: string) {
    const result = await this.searchModel.deleteMany({ productId }).exec();
    this.logger.log(
      `Search index deleted for product: ${productId} (Removed: ${result.deletedCount})`,
    );
  }

  //search products
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

    const cacheKey = `search_${query}_${page}_${limit}`;
    const cachedResult = await this.cacheManager.get<any>(cacheKey);

    if (cachedResult) {
      this.logger.log(`Cache hit for search: ${query}`);
      return cachedResult;
    }

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

    this.logger.log(`Executed search query - Found: ${total} results`);

    const result = {
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

    await this.cacheManager.set(cacheKey, result, 30000); // 30s cache

    return result;
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
