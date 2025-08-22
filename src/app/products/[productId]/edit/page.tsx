import prisma from "@/lib/prisma";
import EditProductForm from "@/components/EditProductForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

interface EditProductPageProps {
  params: {
    productId: string;
  };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const resolvedParams = await params; // Await params
  const { productId } = resolvedParams;
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
