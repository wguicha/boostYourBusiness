'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function createBusinessForUser(prevState: { message: string } | undefined, formData: FormData) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return { message: 'Usuario no autenticado.' };
  }

  const businessName = formData.get('businessName') as string;
  if (!businessName || businessName.trim().length < 3) {
    return { message: 'El nombre del negocio debe tener al menos 3 caracteres.' };
  }

  const userId: string = session.user.id;

  try {
    await prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          name: businessName,
        },
      });

      await tx.businessUser.create({
        data: {
          userId: userId,
          businessId: business.id,
          role: 'OWNER',
        },
      });
    });
  } catch (error) {
    console.error('Error creating business:', error);
    return { message: 'No se pudo crear el negocio.' };
  }

  revalidatePath('/products');
  redirect('/products');
}