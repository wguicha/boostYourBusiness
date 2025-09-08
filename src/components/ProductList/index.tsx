'use client';

import styles from './ProductList.module.css';
import { deleteProduct } from "@/app/products/actions";
import ProductCard from '@/components/ProductCard/index';

import { Product as PrismaProduct } from '@prisma/client';

interface Product extends Omit<PrismaProduct, 'price'> {
  price: string;
  businessId: string;
}

interface ProductListProps {
  products: Product[];
  onEdit: (productId: string) => void;
  onDelete: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onDirectSale: (product: Product) => void;
  showEditAction?: boolean;
  showDeleteAction?: boolean;
  showSaleActions?: boolean;
}

export default function ProductList({ products, onEdit, onDelete, onAddToCart, onDirectSale, showEditAction, showDeleteAction, showSaleActions }: ProductListProps) {
  return (
    <div className={styles.productListGrid}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddToCart={onAddToCart}
          onDirectSale={onDirectSale}
          showEditAction={showEditAction}
          showDeleteAction={showDeleteAction}
          showSaleActions={showSaleActions}
        />
      ))}
    </div>
  );
}
