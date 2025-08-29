import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { auth } from '../../../auth';
import { Decimal } from '@prisma/client/runtime/library'; // Import Decimal

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const userWithBusinesses = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      businesses: {
        select: { businessId: true },
        take: 1,
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
            product: true, // Include product details if it's a product sale item
            combo: { // Include combo details if it's a combo sale item
              include: {
                products: { // Include products within the combo
                  include: {
                    product: true, // Include product details for combo items
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Order by most recent sales first
      },
    });

    // Convert Decimal to string for client component serialization
    const serializableSales = sales.map(sale => ({
      ...sale,
      totalAmount: sale.totalAmount.toString(),
      items: sale.items.map(item => ({
        ...item,
        priceAtSale: item.priceAtSale.toString(),
        product: item.product ? { ...item.product, price: item.product.price.toString() } : null,
        combo: item.combo ? {
          ...item.combo,
          price: item.combo.price.toString(),
          products: item.combo.products.map(cp => ({
            ...cp,
            product: { ...cp.product, price: cp.product.price.toString() }
          }))
        } : null,
      })),
    }));

    // Aggregate by product (re-adding original logic)
    const salesByProduct: { [key: string]: { name: string; quantity: number; total: number } } = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const itemName = item.product?.name || item.combo?.name || 'Desconocido'; // Use product or combo name
        const itemTotal = new Decimal(item.priceAtSale).mul(item.quantity).toNumber();

        // Use a unique key for product/combo to aggregate correctly
        const key = item.productId || item.comboId;
        if (!key) return; // Skip if no product or combo ID

        if (!salesByProduct[key]) {
          salesByProduct[key] = { name: itemName, quantity: 0, total: 0 };
        }
        salesByProduct[key].quantity += item.quantity;
        salesByProduct[key].total += itemTotal;
      });
    });

    // Aggregate by payment method (re-adding original logic)
    const salesByPaymentMethod: { [key: string]: { method: string; total: number } } = {};
    sales.forEach(sale => {
      const method = sale.paymentMethod;
      const total = new Decimal(sale.totalAmount).toNumber();

      if (!salesByPaymentMethod[method]) {
        salesByPaymentMethod[method] = { method: method, total: 0 };
      }
      salesByPaymentMethod[method].total += total;
    });

    const productsReport = Object.values(salesByProduct);
    const paymentMethodsReport = Object.values(salesByPaymentMethod);

    return NextResponse.json({
      sales: serializableSales, // Individual sales records
      productsReport,          // Aggregated by product
      paymentMethodsReport,    // Aggregated by payment method
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
