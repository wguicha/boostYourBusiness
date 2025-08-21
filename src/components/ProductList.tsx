'use client';

import Image from "next/image";
import { deleteProduct } from "@/app/products/actions";
import { useRouter } from 'next/navigation';

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <div key={product.id} className="border p-4 rounded-lg shadow">
          <div className="w-full aspect-[4/3] relative mb-4 block overflow-hidden">
            <Image
              src={product.imageUrl || '/placeholder.svg'} // Placeholder if no image
              alt={product.name}
              fill={true}
              className="rounded-md object-cover"
            />
          </div>
          <h3 className="font-bold text-lg">{product.name}</h3>
          <p className="text-gray-600">{product.description}</p>
          <div className="flex justify-between items-center mt-4">
            <span className="font-mono text-lg">${product.price.toString()}</span>
            <span className="text-sm">Stock: {product.quantity}</span>
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <button 
              onClick={() => router.push(`/products/${product.id}/edit`)}
              className="bg-blue-500 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded"
            >
              Editar
            </button>
            <button 
              onClick={async () => {
                if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
                  await deleteProduct(product.id);
                }
              }}
              className="bg-red-500 hover:bg-red-700 text-white text-sm py-1 px-3 rounded"
            >
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
