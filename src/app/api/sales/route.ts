import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { auth } from '../../../auth';

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Assuming a user is associated with a business, or we need to get the businessId from the user's session/profile
  // For now, let's assume the user's businessId is directly available or can be fetched.
  // This part might need adjustment based on how businessId is linked to the authenticated user.
  // For demonstration, let's try to find the businessId from the user's associated businesses.
  const userWithBusinesses = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      businesses: {
        select: { businessId: true },
        take: 1, // Assuming a user belongs to at least one business for this context
      },
    },
  });

  const businessId = userWithBusinesses?.businesses[0]?.businessId;

  if (!businessId) {
    return NextResponse.json({ message: 'Business not found for user' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');

  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (startDateParam) {
    startDate = new Date(startDateParam);
    startDate.setUTCHours(0, 0, 0, 0); // Start of the day
  }

  if (endDateParam) {
    endDate = new Date(endDateParam);
    endDate.setUTCHours(23, 59, 59, 999); // End of the day
  }

  try {
    const sales = await prisma.sale.findMany({
      where: {
        businessId: businessId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Aggregate by product
    const salesByProduct: { [key: string]: { name: string; quantity: number; total: number } } = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const productId = item.productId;
        const productName = item.product.name;
        const itemTotal = item.quantity * item.priceAtSale.toNumber(); // Convert Decimal to number

        if (!salesByProduct[productId]) {
          salesByProduct[productId] = { name: productName, quantity: 0, total: 0 };
        }
        salesByProduct[productId].quantity += item.quantity;
        salesByProduct[productId].total += itemTotal;
      });
    });

    // Aggregate by payment method
    const salesByPaymentMethod: { [key: string]: { method: string; total: number } } = {};
    sales.forEach(sale => {
      const method = sale.paymentMethod;
      const total = sale.totalAmount.toNumber(); // Convert Decimal to number

      if (!salesByPaymentMethod[method]) {
        salesByPaymentMethod[method] = { method: method, total: 0 };
      }
      salesByPaymentMethod[method].total += total;
    });

    // Convert aggregated objects to arrays for easier consumption
    const productsReport = Object.values(salesByProduct);
    const paymentMethodsReport = Object.values(salesByPaymentMethod);

    return NextResponse.json({ productsReport, paymentMethodsReport });
  } catch (error) {
    console.error('Error fetching sales report:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
