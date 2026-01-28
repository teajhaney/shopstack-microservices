//evenst are used to notify other microservices of changes to the database
//public contracts between microservices
//small + stable

export type ProductCreatedEvent = {
  productId: string;
  name: string;
  description: string;
  status: 'DRAFT' | 'ACTIVE';
  price: number;
  imageUrl?: string;
  createdByClerkUserId: string;
};
