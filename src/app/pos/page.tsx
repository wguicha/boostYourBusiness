import prisma from "@/lib/prisma";
import POSClient from "@/components/pos/POSClient";
import { getServerSession } from "next-auth";
import { authConfig } from "@/auth.config";
import { redirect } from "next/navigation";

export default async function POSPage() {
  const session = await getServerSession(authConfig);

  if (!session || !session.user?.id) {
    redirect("/auth/signin");
  }

  const userBusiness = await prisma.businessUser.findFirst({
    where: { userId: session.user.id },
    select: { businessId: true },
  });

  if (!userBusiness) {
    redirect('/onboarding');
  }

  const products = await prisma.product.findMany({
    where: {
      businessId: userBusiness.businessId,
    },
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
    <POSClient products={serializableProducts} businessId={userBusiness.businessId} />
  );
}
