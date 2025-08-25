import prisma from "@/lib/prisma";
import AddProductForm from "@/components/AddProductForm";
import ProductList from "@/components/ProductList";
import { getServerSession } from "next-auth";
import { authConfig } from "@/auth.config";
import { redirect } from "next/navigation";

export default async function ProductsPage() {
  console.log('Rendering Products page'); // Added console.log
  const session = await getServerSession(authConfig);

  if (!session || !session.user?.id) {
    redirect("/auth/signin");
  }

  const userBusiness = await prisma.businessUser.findFirst({
    where: { userId: session.user.id },
    select: { businessId: true },
  });

  let products = [];
  if (userBusiness) {
    products = await prisma.product.findMany({
      where: {
        businessId: userBusiness.businessId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  } else {
    redirect('/onboarding');
  }

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
