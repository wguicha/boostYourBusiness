'use client';

import { useFormStatus } from 'react-dom';
import { updateProduct } from '@/app/products/actions';
import { useRouter } from 'next/navigation';

// Import Product type from Prisma client, but override price to be string
import { Product as PrismaProduct } from '@prisma/client';

interface Product extends Omit<PrismaProduct, 'price'> {
  price: string;
}

interface EditProductFormProps {
  product: Product;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button 
      type="submit" 
      disabled={pending}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
    >
      {pending ? 'Actualizando...' : 'Actualizar Producto'}
    </button>
  );
}

export default function EditProductForm({ product }: EditProductFormProps) {
  const router = useRouter();

  const handleUpdate = async (formData: FormData) => {
    try {
      await updateProduct(product.id, formData);
      router.push('/products'); // Navigate back to product list
    } catch (error) {
      console.error('Error al actualizar el producto:', error);
      alert('Error al actualizar el producto.');
    }
  };

  return (
    <form action={handleUpdate} className="p-4 border rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-4">Editar Producto</h2>
      <div className="mb-4">
        <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">Nombre del Producto</label>
        <input type="text" id="name" name="name" defaultValue={product.name} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
      </div>
      <div className="mb-4">
        <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Descripción</label>
        <textarea id="description" name="description" defaultValue={product.description || ''} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
      </div>
      <div className="mb-4">
        <label htmlFor="image" className="block text-gray-700 text-sm font-bold mb-2">Imagen del Producto (dejar vacío para mantener la actual)</label>
        <input type="file" id="image" name="image" accept="image/*" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
      </div>
      <div className="flex gap-4 mb-4">
        <div className="w-1/2">
          <label htmlFor="price" className="block text-gray-700 text-sm font-bold mb-2">Precio</label>
          <input type="number" id="price" name="price" step="0.01" defaultValue={parseFloat(product.price).toFixed(2)} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
        </div>
        <div className="w-1/2">
          <label htmlFor="quantity" className="block text-gray-700 text-sm font-bold mb-2">Cantidad</label>
          <input type="number" id="quantity" name="quantity" step="1" defaultValue={product.quantity} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
        </div>
      </div>
      <SubmitButton />
    </form>
  );
}
