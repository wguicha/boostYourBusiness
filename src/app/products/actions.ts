'use server';

import prisma from '@/lib/prisma';
import cloudinary from '@/lib/cloudinary';
import { revalidatePath } from 'next/cache';

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
    },
  });

  revalidatePath('/products');
}
