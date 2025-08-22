import prisma from "@/lib/prisma";
import POSClient from "@/components/POSClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function POSPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const products = await prisma.product.findMany({
    orderBy: {
      quantity: 'desc',
    },
  });

  // Convert Decimal to string for client component serialization
  const serializableProducts = products.map(product => ({
    ...product,
    price: product.price.toString(),
  }));

  return (
    <POSClient products={serializableProducts} />
  );
}
