import prisma from "@/lib/prisma";
import EditProductForm from "@/components/EditProductForm/index";

import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function EditProductPage({ params }: any) {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  const { productId } = params;
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    return <div className="container mx-auto p-4">Producto no encontrado.</div>;
  }

  // Convert Decimal to string for client component serialization
  const serializableProduct = {
    ...product,
    price: product.price.toString(),
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Editar Producto: {product.name}</h1>
      <EditProductForm product={serializableProduct} />
    </div>
  );
}
