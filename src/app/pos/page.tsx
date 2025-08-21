import prisma from "@/lib/prisma";
import POSClient from "@/components/POSClient";

export default async function POSPage() {
  const products = await prisma.product.findMany();

  // Convert Decimal to string for client component serialization
  const serializableProducts = products.map(product => ({
    ...product,
    price: product.price.toString(),
  }));

  return (
    <POSClient products={serializableProducts} />
  );
}
