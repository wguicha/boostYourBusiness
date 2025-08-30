import prisma from "@/lib/prisma";
import POSClient from "@/components/POSClient/index";
import { auth } from "@/auth";
import { authConfig } from "@/auth.config";
import { redirect } from "next/navigation";

export default async function POSPage() {
  const session = await auth();

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

  const combos = await prisma.combo.findMany({
    where: {
      businessId: userBusiness.businessId,
    },
    include: {
      products: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Convert Decimal to string for client component serialization
  const serializableProducts = products.map(product => ({
    ...product,
    price: product.price.toString(),
    type: 'product' as const, // Explicitly cast to literal type
  }));

  const serializableCombos = combos.map(combo => ({
    ...combo,
    price: combo.price.toString(),
    products: combo.products.map(cp => ({
      ...cp,
      product: {
        ...cp.product,
        price: cp.product.price.toString(), // Ensure nested product prices are also strings
        type: 'product' as const, // Explicitly cast to literal type
      },
    })),
    type: 'combo' as const, // Explicitly cast to literal type
  }));

  return (
    <POSClient
      products={serializableProducts}
      combos={serializableCombos} // Pass combos as a prop
      businessId={userBusiness.businessId}
    />
  );
}