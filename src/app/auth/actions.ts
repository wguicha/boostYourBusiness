'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function registerUser(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    throw new Error('Email y contraseña son requeridos.');
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('El email ya está registrado.');
  }

  const hashedPassword = await bcrypt.hash(password, 10); // Hash password with salt rounds

  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });

  return { success: true };
}

export async function updateUserProfile(userId: string, formData: FormData) {
  const name = formData.get('name') as string;
  const businessName = formData.get('businessName') as string;

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: name || null,
      businessName: businessName || null,
    },
  });

  revalidatePath('/profile');
}
