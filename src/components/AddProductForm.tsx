'use client';

import { useFormStatus } from 'react-dom';
import { addProduct } from '@/app/products/actions';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button 
      type="submit" 
      disabled={pending}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
    >
      {pending ? 'Agregando...' : 'Agregar Producto'}
    </button>
  );
}

export default function AddProductForm() {
  return (
    <form action={addProduct} encType="multipart/form-data" className="p-4 border rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-4">Agregar Nuevo Producto</h2>
      <div className="mb-4">
        <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">Nombre del Producto</label>
        <input type="text" id="name" name="name" required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
      </div>
      <div className="mb-4">
        <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Descripción</label>
        <textarea id="description" name="description" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
      </div>
      <div className="mb-4">
        <label htmlFor="image" className="block text-gray-700 text-sm font-bold mb-2">Imagen del Producto</label>
        <input type="file" id="image" name="image" accept="image/*" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
      </div>
      <div className="flex gap-4 mb-4">
        <div className="w-1/2">
          <label htmlFor="price" className="block text-gray-700 text-sm font-bold mb-2">Precio</label>
          <input type="number" id="price" name="price" step="0.01" required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
        </div>
        <div className="w-1/2">
          <label htmlFor="quantity" className="block text-gray-700 text-sm font-bold mb-2">Cantidad</label>
          <input type="number" id="quantity" name="quantity" step="1" required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
        </div>
      </div>
      <SubmitButton />
    </form>
  );
}
