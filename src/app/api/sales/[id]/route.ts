import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// GET /api/sales/[id] - Fetches a single sale by ID
export async function GET(req: Request, context: any) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = context.params;

  try {
    const sale = await prisma.sale.findUnique({
      where: { id },
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
    });

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    // Ensure the sale belongs to the user's business
    const userBusiness = await prisma.businessUser.findFirst({
      where: { userId: session.user.id },
      select: { businessId: true },
    });

    if (!userBusiness || sale.businessId !== userBusiness.businessId) {
      return NextResponse.json({ error: 'Unauthorized access to sale' }, { status: 403 });
    }

    // Serialize Decimal types
    const serializableSale = {
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
    };

    return NextResponse.json(serializableSale);
  } catch (error) {
    console.error('Error fetching sale:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

// PUT /api/sales/[id] - Updates an existing sale
export async function PUT(req: Request, context: any) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = context.params;
  const body = await req.json();
  const { paymentMethod, items } = body; // items should be an array of { id, quantity, priceAtSale, productId?, comboId? }

  if (!paymentMethod || !items || !Array.isArray(items)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const userBusiness = await prisma.businessUser.findFirst({
      where: { userId: session.user.id },
      select: { businessId: true },
    });

    if (!userBusiness) {
      return NextResponse.json({ error: 'User not associated with a business' }, { status: 400 });
    }

    const existingSale = await prisma.sale.findUnique({
      where: { id },
      include: { items: true }, // Include existing items to compare
    });

    if (!existingSale || existingSale.businessId !== userBusiness.businessId) {
      return NextResponse.json({ error: 'Sale not found or unauthorized' }, { status: 404 });
    }

    const updatedSale = await prisma.$transaction(async (tx) => {
      // Calculate new total amount
      let newTotalAmount = new Decimal(0);
      for (const item of items) {
        newTotalAmount = newTotalAmount.plus(new Decimal(item.priceAtSale).mul(item.quantity));
      }

      // --- Inventory Adjustment Logic ---
      // 1. Revert old sale's inventory
      for (const oldItem of existingSale.items) {
        if (oldItem.productId) {
          await tx.product.update({
            where: { id: oldItem.productId },
            data: { quantity: { increment: oldItem.quantity } },
          });
        } else if (oldItem.comboId) {
          const combo = await tx.combo.findUnique({
            where: { id: oldItem.comboId },
            include: { products: true },
          });
          if (combo) {
            for (const cp of combo.products) {
              await tx.product.update({
                where: { id: cp.productId },
                data: { quantity: { increment: cp.quantity * oldItem.quantity } },
              });
            }d
          }
        }
      }

      // 2. Apply new sale's inventory deductions (with checks)
      for (const newItem of items) {
        if (newItem.productId) {
          const product = await tx.product.findUnique({ where: { id: newItem.productId } });
          if (!product || product.quantity < newItem.quantity) {
            throw new Error(`Stock insuficiente para el producto ${product?.name || newItem.productId}.`);
          }
          await tx.product.update({
            where: { id: newItem.productId },
            data: { quantity: { decrement: newItem.quantity } },
          });
        } else if (newItem.comboId) {
          const combo = await tx.combo.findUnique({
            where: { id: newItem.comboId },
            include: { products: true },
          });
          if (!combo) {
            throw new Error(`Combo ${newItem.comboId} no encontrado.`);
          }
          for (const cp of combo.products) {
            const productInCombo = await tx.product.findUnique({ where: { id: cp.productId } });
            const requiredQuantity = cp.quantity * newItem.quantity;
            if (!productInCombo || productInCombo.quantity < requiredQuantity) {
              throw new Error(`Stock insuficiente para el producto ${productInCombo?.name || cp.productId} (parte del combo ${combo.name}).`);
            }
            await tx.product.update({
              where: { id: cp.productId },
              data: { quantity: { decrement: requiredQuantity } },
            });
          }
        }
      }
      // --- End Inventory Adjustment Logic ---

      // 3. Delete old SaleItems and create new ones
      await tx.saleItem.deleteMany({
        where: { saleId: id },
      });

      const newSaleItemsData = items.map((item: any) => ({
        saleId: id,
        productId: item.productId || null,
        comboId: item.comboId || null,
        quantity: item.quantity,
        priceAtSale: new Decimal(item.priceAtSale),
      }));

      await tx.saleItem.createMany({
        data: newSaleItemsData,
      });

      // 4. Update the Sale record
      const sale = await tx.sale.update({
        where: { id },
        data: {
          paymentMethod,
          totalAmount: newTotalAmount,
        },
      });

      return sale;
    });

    // Refetch the updated sale with its relations to return it in the response
    const updatedSaleWithDetails = await prisma.sale.findUnique({
      where: { id: updatedSale.id },
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
    });

    return NextResponse.json(updatedSaleWithDetails);
  } catch (error: any) {
    console.error('Error updating sale:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}

// DELETE /api/sales/[id] - Deletes a sale
export async function DELETE(req: Request, context: any) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = context.params;

  try {
    const userBusiness = await prisma.businessUser.findFirst({
      where: { userId: session.user.id },
      select: { businessId: true },
    });

    if (!userBusiness) {
      return NextResponse.json({ error: 'User not associated with a business' }, { status: 400 });
    }

    const existingSale = await prisma.sale.findUnique({
      where: { id },
      include: { items: true }, // Include items to revert inventory
    });

    if (!existingSale || existingSale.businessId !== userBusiness.businessId) {
      return NextResponse.json({ error: 'Sale not found or unauthorized' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Revert inventory for all items in the sale
      for (const oldItem of existingSale.items) {
        if (oldItem.productId) {
          await tx.product.update({
            where: { id: oldItem.productId },
            data: { quantity: { increment: oldItem.quantity } },
          });
        } else if (oldItem.comboId) {
          const combo = await tx.combo.findUnique({
            where: { id: oldItem.comboId },
            include: { products: true },
          });
          if (combo) {
            for (const cp of combo.products) {
              await tx.product.update({
                where: { id: cp.productId },
                data: { quantity: { increment: cp.quantity * oldItem.quantity } },
              });
            }
          }
        }
      }

      // Delete SaleItems first
      await tx.saleItem.deleteMany({
        where: { saleId: id },
      });

      // Then delete the Sale itself
      await tx.sale.delete({
        where: { id },
      });
    });

    return NextResponse.json({ message: 'Sale deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting sale:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
