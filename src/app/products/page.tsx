import ProductList from "@/components/ProductList";
import { signOut } from 'next-auth/react';

export default async function ProductsPage() {
  const products = await prisma.product.findMany();

  // Convert Decimal to string for client component serialization
  const serializableProducts = products.map(product => ({
    ...product,
    price: product.price.toString(),
  }));

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Gestión de Productos</h1>
        <button 
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          className="bg-red-500 hover:bg-red-700 text-white text-sm py-1 px-3 rounded"
        >
          Cerrar Sesión
        </button>
      </div>
      
      <AddProductForm />

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Lista de Productos</h2>
        {serializableProducts.length === 0 ? (
          <p className="text-gray-500">No hay productos registrados.</p>
        ) : (
          <ProductList products={serializableProducts} />
        )}
      </div>
    </div>
  );
}
