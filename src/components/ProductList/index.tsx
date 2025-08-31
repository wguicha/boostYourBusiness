'use client';

import styles from './ProductList.module.css';

import Image from "next/image";
import { deleteProduct } from "@/app/products/actions";
import { useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard/index'; // Import ProductCard

// Import Product type from Prisma client, but override price to be string
import { Product as PrismaProduct } from '@prisma/client';

interface Product extends Omit<PrismaProduct, 'price'> {
  price: string;
  businessId: string; // Add businessId
}

interface ProductListProps {
  products: Product[];
  onEdit: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onDirectSale: (product: Product) => void;
  showActions?: boolean;
}

export default function ProductList({ products, onEdit, onAddToCart, onDirectSale, showActions }: ProductListProps) {
  return (
    <div className={styles.productListGrid}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onEdit={onEdit}
          onAddToCart={onAddToCart}
          onDirectSale={onDirectSale}
          showActions={showActions}
        />
      ))}
    </div>
  );
}
