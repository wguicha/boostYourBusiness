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
  onEditProduct: (product: Product) => void; // New prop for editing
}

export default function ProductList({ products, onEditProduct }: ProductListProps) {
  const router = useRouter();

  const handleEdit = (productId: string) => {
    const productToEdit = products.find(p => p.id === productId);
    if (productToEdit) {
      onEditProduct(productToEdit);
    }
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
      {products.map((product) => {
        const productForCard = {
          ...product,
          price: parseFloat(product.price), // Convert price to number
        };
        return (
          <ProductCard
            key={product.id}
            product={productForCard}
            onEdit={handleEdit}
            onAddToCart={handleAddToCart}
            onDirectSale={handleDirectSale}
          />
        );
      })}
    </div>
  );
}
