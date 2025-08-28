import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { auth } from '../../../auth';

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userBusiness = await prisma.businessUser.findFirst({
    where: { userId: session.user.id },
    select: { businessId: true },
  });

  if (!userBusiness) {
    return NextResponse.json({ message: 'Business not found for user' }, { status: 404 });
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        businessId: userBusiness.businessId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Convert Decimal to string for client component serialization
    const serializableProducts = products.map(product => ({
      ...product,
      price: product.price.toString(),
    }));

    return NextResponse.json(serializableProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
