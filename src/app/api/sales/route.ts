import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { Decimal } from '@prisma/client/runtime/library';

// Helper function to verify user's membership in a business
async function verifyUserMembership(userId: string, businessId: string) {
  const membership = await prisma.businessUser.findUnique({
    where: {
      businessId_userId: { businessId, userId },
      status: 'ACCEPTED',
    },
  });
  return membership;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  if (!businessId) {
    return NextResponse.json({ message: 'Business ID is required' }, { status: 400 });
  }

  const membership = await verifyUserMembership(session.user.id, businessId);
  if (!membership) {
    return NextResponse.json({ message: 'Forbidden: You are not a member of this business.' }, { status: 403 });
  }

  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');

  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (startDateParam) {
    startDate = new Date(startDateParam);
    startDate.setUTCHours(0, 0, 0, 0);
  }

  if (endDateParam) {
    endDate = new Date(endDateParam);
    endDate.setUTCHours(23, 59, 59, 999);
  }

  try {
    const sales = await prisma.sale.findMany({
      where: {
        businessId: businessId, // Use validated businessId
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: {
          include: {
            product: true,
            combo: { 
              include: {
                products: { 
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

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

    const salesByProduct: { [key: string]: { name: string; quantity: number; total: number } } = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const itemName = item.product?.name || item.combo?.name || 'Desconocido';
        const itemTotal = new Decimal(item.priceAtSale).mul(item.quantity).toNumber();
        const key = item.productId || item.comboId;
        if (!key) return;
        if (!salesByProduct[key]) {
          salesByProduct[key] = { name: itemName, quantity: 0, total: 0 };
        }
        salesByProduct[key].quantity += item.quantity;
        salesByProduct[key].total += itemTotal;
      });
    });

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

    const reportType = searchParams.get('reportType');

    if (reportType === 'summary') {
      return NextResponse.json({
        productsReport,
        paymentMethodsReport,
      });
    }

    return NextResponse.json({
      sales: serializableSales,
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

