'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ProductType } from '@prisma/client';

export async function addProduct(data: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const businessUser = await prisma.businessUser.findFirst({
    where: { userId: session.user.id },
    select: { business: true },
  });

  if (!businessUser || !businessUser.business) {
    return { error: 'User is not associated with a business' };
  }

  const { business } = businessUser;

  const name = data.get('name') as string;
  const description = data.get('description') as string;
  const price = data.get('price') as string;
  const quantity = data.get('quantity') as string;
  const type = data.get('type') as ProductType;

  if (!name || !price || !quantity || !type) {
    return { error: 'Missing required fields' };
  }

  try {
    await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        type,
        businessId: business.id,
        // TODO: Handle image upload
      },
    });

    revalidatePath('/products');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to create product' };
  }
}

export async function deleteProduct(productId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const userBusiness = await prisma.businessUser.findFirst({
    where: { userId: session.user.id },
  });

  if (!userBusiness) {
    throw new Error('User is not associated with any business');
  }

  const result = await prisma.product.deleteMany({
    where: {
      id: productId,
      businessId: userBusiness.businessId,
    },
  });

  if (result.count === 0) {
    throw new Error('Product not found or user does not have permission');
  }

  revalidatePath('/products');
}

export async function updateProduct(productId: string, data: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const name = data.get('name') as string;
  const description = data.get('description') as string;
  const price = data.get('price') as string;
  const quantity = data.get('quantity') as string;
  const type = data.get('type') as ProductType;

  if (!productId || !name || !price || !quantity || !type) {
    return { error: 'Missing required fields' };
  }

  try {
    // TODO: Verify that the product belongs to the user's business
    await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        description,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        type,
      },
    });

    revalidatePath('/products');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to update product' };
  }
}