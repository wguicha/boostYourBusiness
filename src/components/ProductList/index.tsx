'use client';

import Image from "next/image";
import { deleteProduct } from "@/app/products/actions";
import { useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard/index'; // Import ProductCard

interface ProductListProps {
  products: Array<{
    id: string;
    name: string;
    description: string | null;
    price: string; // Price as string from server
    quantity: number;
    imageUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

export default function ProductList({ products }: ProductListProps) {
  const router = useRouter();

  const handleEdit = (productId: string) => {
    router.push(`/products/${productId}/edit`);
  };

  const handleAddToCart = (product: any) => {
    // Implement add to cart logic here
    console.log('Add to cart:', product.name);
  };

  const handleDirectSale = (product: any) => {
    // Implement direct sale logic here
    console.log('Direct sale:', product.name);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onEdit={handleEdit}
          onAddToCart={handleAddToCart}
          onDirectSale={handleDirectSale}
        />
      ))}
    </div>
  );
}
