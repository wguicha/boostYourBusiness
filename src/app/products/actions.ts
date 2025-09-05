'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ProductType } from '@prisma/client';
import cloudinary from '@/lib/cloudinary';

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

export async function addProduct(data: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const businessId = data.get('businessId') as string;
  if (!businessId) {
    return { error: 'Business ID is required' };
  }

  const membership = await verifyUserMembership(session.user.id, businessId);
  if (!membership) {
    return { error: 'Forbidden: You are not a member of this business.' };
  }

  const name = data.get('name') as string;
  const description = data.get('description') as string;
  const price = data.get('price') as string;
  const quantity = data.get('quantity') as string;
  const type = data.get('type') as ProductType;
  const image = data.get('image') as File;

  if (!name || !price || !quantity || !type) {
    return { error: 'Missing required fields' };
  }

  let imageUrl: string | undefined;
  if (image && image.size > 0) {
    const arrayBuffer = await image.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
        cloudinary.uploader.upload_stream({}, (error, result) => {
            if (error) return reject(error);
            if (result) return resolve(result);
            reject(new Error("Cloudinary upload result is undefined."));
        }).end(buffer);
    });
    imageUrl = uploadResult.secure_url;
  }

  try {
    await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        type,
        businessId: businessId, // Use the validated businessId
        imageUrl,
      },
    });

    revalidatePath('/products');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to create product' };
  }
}

export async function deleteProduct(productId: string, businessId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  if (!businessId) {
    throw new Error('Business ID is required');
  }

  const membership = await verifyUserMembership(session.user.id, businessId);
  if (!membership) {
    throw new Error('Forbidden: You are not a member of this business.');
  }

  const result = await prisma.product.deleteMany({
    where: {
      id: productId,
      businessId: businessId, // Ensure deletion is scoped to the business
    },
  });

  if (result.count === 0) {
    throw new Error('Product not found in this business or permission denied');
  }

  revalidatePath('/products');
}

export async function updateProduct(productId: string, data: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const businessId = data.get('businessId') as string;
  if (!businessId) {
    return { error: 'Business ID is required' };
  }

  const membership = await verifyUserMembership(session.user.id, businessId);
  if (!membership) {
    return { error: 'Forbidden: You are not a member of this business.' };
  }

  const name = data.get('name') as string;
  const description = data.get('description') as string;
  const price = data.get('price') as string;
  const quantity = data.get('quantity') as string;
  const type = data.get('type') as ProductType;
  const image = data.get('image') as File;

  if (!productId || !name || !price || !quantity || !type) {
    return { error: 'Missing required fields' };
  }

  let imageUrl: string | undefined;
  if (image && image.size > 0) {
    const arrayBuffer = await image.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
        cloudinary.uploader.upload_stream({}, (error, result) => {
            if (error) return reject(error);
            if (result) return resolve(result);
            reject(new Error("Cloudinary upload result is undefined."));
        }).end(buffer);
    });
    imageUrl = uploadResult.secure_url;
  }

  try {
    const dataToUpdate: any = {
        name,
        description,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        type,
    };

    if (imageUrl) {
        dataToUpdate.imageUrl = imageUrl;
    }

    await prisma.product.updateMany({
      where: { 
        id: productId,
        businessId: businessId, // Ensure update is scoped to the business
      },
      data: dataToUpdate,
    });

    revalidatePath('/products');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to update product' };
  }
}
