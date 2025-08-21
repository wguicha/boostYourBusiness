'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Decimal } from '@prisma/client/runtime/library';

interface CartItem {
  id: string;
  name: string;
  price: string; // Price as string from client
  quantity: number; // Quantity in cart
}

export async function recordSale(cartItems: CartItem[], totalAmount: number, paymentMethod: string) {
  if (cartItems.length === 0) {
    throw new Error('El carrito está vacío.');
  }

  // Use a transaction to ensure atomicity
  await prisma.$transaction(async (tx) => {
    // 1. Create the Sale record
    const sale = await tx.sale.create({
      data: {
        totalAmount: new Decimal(totalAmount),
        paymentMethod,
        items: {
          create: cartItems.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            priceAtSale: new Decimal(item.price),
          })),
        },
      },
    });

    // 2. Update product quantities
    for (const item of cartItems) {
      await tx.product.update({
        where: { id: item.id },
        data: {
          quantity: {
            decrement: item.quantity,
          },
        },
      });
    }
  });

  revalidatePath('/pos'); // Revalidate POS page to reflect inventory changes
  revalidatePath('/products'); // Revalidate products page for inventory changes
}
