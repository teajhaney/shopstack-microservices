export type Product = {
  _id: string;
  name: string;
  description: string;
  price: number;
  status: 'DRAFT' | 'ACTIVE';
  imageUrl: string;
  createdByClerkUserId: string;
};
export type UploadProductResponse = {
  url: string;
  mediaId: string;
};

export type AttachedToProductResponse = {
  mediaId: string;
  productId: string;
  attchedByUserId: string;
};

export class PaginatedProductsResponse {
  products: any[];
  pagination: {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
  };
}
