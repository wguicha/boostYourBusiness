'use client';

import Image from 'next/image';
import { FiEdit, FiShoppingCart, FiDollarSign } from 'react-icons/fi';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    stock: number;
    imageUrl?: string | null;
  };
  onEdit: (productId: string) => void;
  onAddToCart: (product: any) => void;
  onDirectSale: (product: any) => void;
}

export default function ProductCard({ product, onEdit, onAddToCart, onDirectSale }: ProductCardProps) {
  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="relative w-32 h-32">
        {/* Image Container */}
        <div className="w-full h-full rounded-full border-4 border-yellow-400 overflow-hidden flex items-center justify-center">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={128}
              height={128}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-sm">Sin Imagen</span>
            </div>
          )}
        </div>

        {/* Edit Button */}
        <button 
          onClick={() => onEdit(product.id)} 
          className="absolute -top-1 -right-1 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors z-10"
        >
          <FiEdit size={14} />
        </button>

        {/* Stock Indicator */}
        <div className="absolute -top-1 -left-1 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full z-10">
          {product.stock}
        </div>

        {/* Action Buttons */}
        <div className="absolute -bottom-1 -right-1 flex flex-col space-y-1 z-10">
          <button 
            onClick={() => onDirectSale(product)} 
            className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors"
          >
            <FiDollarSign size={14} />
          </button>
          <button 
            onClick={() => onAddToCart(product)} 
            className="bg-cyan-500 text-white p-2 rounded-full hover:bg-cyan-600 transition-colors"
          >
            <FiShoppingCart size={14} />
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="text-center w-36">
        <p className="font-bold truncate">{product.name}</p>
        <p className="text-gray-600">
          {product.price.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}
        </p>
      </div>
    </div>
  );
}