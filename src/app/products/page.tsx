import prisma from "@/lib/prisma";
import AddProductForm from "@/components/AddProductForm";
import Image from "next/image";

export default async function ProductsPage() {
  const products = await prisma.product.findMany();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gestión de Productos</h1>
      
      <AddProductForm />

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Lista de Productos</h2>
        {products.length === 0 ? (
          <p className="text-gray-500">No hay productos registrados.</p>
        ) : (
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
