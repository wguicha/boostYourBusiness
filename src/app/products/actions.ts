'use server';

import prisma from '@/lib/prisma';
import cloudinary from '@/lib/cloudinary';
import { revalidatePath } from 'next/cache';
import { auth } from "@/auth";
import { authConfig } from '@/auth.config';

async function uploadImage(file: File): Promise<string> {
  const fileBuffer = await file.arrayBuffer();
  const mime = file.type;
  const encoding = 'base64';
  const base64Data = Buffer.from(fileBuffer).toString('base64');
  const fileUri = 'data:' + mime + ';' + encoding + ',' + base64Data;

  const result = await cloudinary.uploader.upload(fileUri, {
    folder: 'boost-your-business',
  });

  return result.secure_url;
}

export async function addProduct(formData: FormData) {
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

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const price = parseFloat(formData.get('price') as string);
  const quantity = parseInt(formData.get('quantity') as string);
  const image = formData.get('image') as File;

  let imageUrl: string | undefined = undefined;

  if (image && image.size > 0) {
    imageUrl = await uploadImage(image);
  }

  if (!name || isNaN(price) || isNaN(quantity)) {
    throw new Error('Invalid data');
  }

  await prisma.product.create({
    data: {
      name,
      description,
      price,
      quantity,
      imageUrl,
      businessId: userBusiness.businessId,
    },
  });

  revalidatePath('/products');
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

export async function updateProduct(productId: string, formData: FormData) {
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

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const price = parseFloat(formData.get('price') as string);
  const quantity = parseInt(formData.get('quantity') as string);
  const image = formData.get('image') as File;

  let imageUrl: string | undefined = undefined;

  if (image && image.size > 0) {
    imageUrl = await uploadImage(image);
  }

  if (!name || isNaN(price) || isNaN(quantity)) {
    throw new Error('Invalid data');
  }

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      businessId: userBusiness.businessId,
    },
  });

  if (!product) {
    throw new Error('Product not found or user does not have permission');
  }

  await prisma.product.update({
    where: { id: productId },
    data: {
      name,
      description,
      price,
      quantity,
      imageUrl: imageUrl || product.imageUrl, // Use new image URL or keep existing
    },
  });

  revalidatePath('/products');
}