import { Product as PrismaProduct, ProductType } from '@prisma/client';

export interface Product extends Omit<PrismaProduct, 'price'> {
  price: string;
}

export interface ComboProductItem {
  product: Product;
  quantity: number;
}

export interface Combo {
  id: string;
  name: string;
  price: string;
  products: ComboProductItem[];
  type: 'combo';
}
