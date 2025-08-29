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

export async function recordSale(cartItems: CartItem[], totalAmount: number, paymentMethod: string, businessId: string) {
  if (cartItems.length === 0) {
    throw new Error('El carrito está vacío.');
  }
  if (!businessId) {
    throw new Error('Business ID no proporcionado.');
  }

  // Use a transaction to ensure atomicity
  await prisma.$transaction(async (tx) => {
    // 1. Create the Sale record
    const sale = await tx.sale.create({
      data: {
        totalAmount: new Decimal(totalAmount),
        paymentMethod,
        businessId: businessId, // Associate sale with the business
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
      const product = await tx.product.findFirst({
        where: { 
          id: item.id,
          businessId: businessId
        }
      });

      if (!product) {
        throw new Error(`Producto con ID ${item.id} no encontrado en este negocio.`);
      }
      if (product.quantity < item.quantity) {
        throw new Error(`Stock insuficiente para ${product.name}.`);
      }

      await tx.product.update({
        where: { id: item.id }, // id is unique, no need for businessId here
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

export async function recordSingleSale(
  productId: string, 
  paymentMethod: string, 
  businessId: string, 
  quantity: number,
  salePrice?: number // Optional sale price
) {
  if (!businessId) {
    throw new Error('Business ID no proporcionado.');
  }
  if (quantity <= 0) {
    throw new Error('La cantidad debe ser mayor que cero.');
  }

  await prisma.$transaction(async (tx) => {
    const product = await tx.product.findFirst({
      where: { 
        id: productId,
        businessId: businessId
      },
    });

    if (!product) {
      throw new Error('Producto no encontrado en este negocio.');
    }
    if (product.quantity < quantity) {
      throw new Error(`Stock insuficiente para ${product.name}.`);
    }

    const finalSalePrice = salePrice !== undefined ? new Decimal(salePrice) : product.price;
    const totalAmount = finalSalePrice.mul(quantity);

    // 1. Create the Sale record for a single item
    const sale = await tx.sale.create({
      data: {
        totalAmount: totalAmount,
        paymentMethod,
        businessId: businessId, // Associate sale with the business
        items: {
          create: [{
            productId: product.id,
            quantity: quantity,
            priceAtSale: finalSalePrice,
          }],
        },
      },
    });

    // 2. Decrement product quantity
    await tx.product.update({
      where: { id: productId }, // id is unique, no need for businessId here
      data: {
        quantity: {
          decrement: quantity,
        },
      },
    });
  });

  revalidatePath('/pos'); // Revalidate POS page to reflect inventory changes
  revalidatePath('/products'); // Revalidate products page for inventory changes
}
