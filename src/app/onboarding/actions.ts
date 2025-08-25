'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth.config';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function createBusinessForUser(prevState: any, formData: FormData) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return { message: 'Usuario no autenticado.' };
  }

  const businessName = formData.get('businessName') as string;
  if (!businessName || businessName.trim().length < 3) {
    return { message: 'El nombre del negocio debe tener al menos 3 caracteres.' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          name: businessName,
        },
      });

      await tx.businessUser.create({
        data: {
          userId: session.user.id,
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