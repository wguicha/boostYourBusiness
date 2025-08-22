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

export async function recordSingleSale(productId: string, paymentMethod: string) {
  await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('Producto no encontrado.');
    }
    if (product.quantity <= 0) {
      throw new Error('Producto sin stock.');
    }

    // 1. Create the Sale record for a single item
    const sale = await tx.sale.create({
      data: {
        totalAmount: product.price, // Price of one unit
        paymentMethod,
        items: {
          create: [{
            productId: product.id,
            quantity: 1,
            priceAtSale: product.price,
          }],
        },
      },
    });

    // 2. Decrement product quantity
    await tx.product.update({
      where: { id: productId },
      data: {
        quantity: {
          decrement: 1,
        },
      },
    });
  });

  revalidatePath('/pos'); // Revalidate POS page to reflect inventory changes
  revalidatePath('/products'); // Revalidate products page for inventory changes
}
