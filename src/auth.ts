import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

const { auth, signIn, signOut } = NextAuth(authConfig);

export const handlers = NextAuth(authConfig).handlers;
export { auth, signIn, signOut };
