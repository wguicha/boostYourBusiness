'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Decimal } from '@prisma/client/runtime/library';

interface CartItem {
  id: string;
  name: string;
  price: string; // Price as string from client
  quantity: number; // Quantity in cart
  type: 'product' | 'combo'; // NEW: To distinguish between product and combo
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
            // Conditionally set productId or comboId based on item type
            productId: item.type === 'product' ? item.id : null,
            comboId: item.type === 'combo' ? item.id : null,
            quantity: item.quantity,
            priceAtSale: new Decimal(item.price),
          })),
        },
      },
    });

    // 2. Update product quantities
    for (const item of cartItems) {
      if (item.type === 'product') {
        // Logic for individual products
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
          where: { id: item.id },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      } else if (item.type === 'combo') {
        // Logic for combos
        const combo = await tx.combo.findUnique({
          where: { id: item.id, businessId: businessId },
          include: {
            products: {
              include: {
                product: true, // Get details of the actual product
              },
            },
          },
        });

        if (!combo) {
          throw new Error(`Combo con ID ${item.id} no encontrado.`);
        }

        // Check and decrement inventory for each product in the combo
        for (const comboProduct of combo.products) {
          const productInCombo = comboProduct.product;
          const requiredQuantity = comboProduct.quantity * item.quantity; // Total quantity of this product needed for the sale

          if (productInCombo.quantity < requiredQuantity) {
            throw new Error(`Stock insuficiente para el producto '${productInCombo.name}' (parte del combo '${combo.name}').`);
          }

          await tx.product.update({
            where: { id: productInCombo.id, businessId: businessId },
            data: {
              quantity: {
                decrement: requiredQuantity,
              },
            },
          });
        }
      } else {
        throw new Error(`Tipo de artículo desconocido: ${item.type}`);
      }
    }
  });

  revalidatePath('/pos'); // Revalidate POS page to reflect inventory changes
  revalidatePath('/products'); // Revalidate products page for inventory changes
}

export async function recordSingleSale(
  itemId: string, // Can be productId or comboId
  paymentMethod: string,
  businessId: string,
  quantity: number,
  salePrice: number, // Sale price is now required for direct sale
  itemType: 'product' | 'combo' // New parameter to distinguish
) {
  if (!businessId) {
    throw new Error('Business ID no proporcionado.');
  }
  if (quantity <= 0) {
    throw new Error('La cantidad debe ser mayor que cero.');
  }

  await prisma.$transaction(async (tx) => {
    let totalAmount: Decimal;
    let saleItemData: { productId?: string; comboId?: string; quantity: number; priceAtSale: Decimal; }[];

    if (itemType === 'product') {
      const product = await tx.product.findFirst({
        where: {
          id: itemId,
          businessId: businessId
        },
      });

      if (!product) {
        throw new Error('Producto no encontrado en este negocio.');
      }
      if (product.quantity < quantity) {
        throw new Error(`Stock insuficiente para ${product.name}.`);
      }

      const finalSalePrice = new Decimal(salePrice);
      totalAmount = finalSalePrice.mul(quantity);

      saleItemData = [{
        productId: product.id,
        quantity: quantity,
        priceAtSale: finalSalePrice,
      }];

      // Decrement product quantity
      await tx.product.update({
        where: { id: itemId },
        data: {
          quantity: {
            decrement: quantity,
          },
        },
      });
    } else if (itemType === 'combo') {
      const combo = await tx.combo.findUnique({
        where: { id: itemId, businessId: businessId },
        include: {
          products: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!combo) {
        throw new Error(`Combo con ID ${itemId} no encontrado.`);
      }

      // Check and decrement inventory for each product in the combo
      for (const comboProduct of combo.products) {
        const productInCombo = comboProduct.product;
        const requiredQuantity = comboProduct.quantity * quantity; // Total quantity of this product needed for the sale

        if (productInCombo.quantity < requiredQuantity) {
          throw new Error(`Stock insuficiente para el producto '${productInCombo.name}' (parte del combo '${combo.name}').`);
        }

        await tx.product.update({
          where: { id: productInCombo.id, businessId: businessId },
          data: {
            quantity: {
              decrement: requiredQuantity,
            },
          },
        });
      }

      const finalSalePrice = new Decimal(salePrice);
      totalAmount = finalSalePrice.mul(quantity);

      saleItemData = [{
        comboId: combo.id,
        quantity: quantity,
        priceAtSale: finalSalePrice,
      }];
    } else {
      throw new Error(`Tipo de artículo desconocido para venta directa: ${itemType}`);
    }

    // Create the Sale record
    await tx.sale.create({
      data: {
        totalAmount: totalAmount,
        paymentMethod,
        businessId: businessId,
        items: {
          create: saleItemData,
        },
      },
    });
  });

  revalidatePath('/pos'); // Revalidate POS page to reflect inventory changes
  revalidatePath('/products'); // Revalidate products page for inventory changes
}
