import prisma from "@/lib/prisma";
import AddProductForm from "@/components/AddProductForm";
import ProductList from "@/components/ProductList";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function ProductsPage() {
  console.log('Rendering Products page'); // Added console.log
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

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
