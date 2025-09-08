import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Por favor, ingresa email y contraseña.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            businesses: {
              include: {
                business: true,
              },
            },
          },
        });

        if (!user || !user.password) {
          // For security, we don't want to reveal if the user exists or not.
          // A generic message is better.
          throw new Error("Usuario no encontrado o contraseña incorrecta.");
        }

        const isValid = await bcrypt.compare(credentials.password as string, user.password);

        if (!isValid) {
          throw new Error("Usuario no encontrado o contraseña incorrecta.");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          businessName: user.businesses[0]?.business.name || null, // Add businessName
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.businessName = user.businessName; // Add businessName to token
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      if (token.name && session.user) {
        session.user.name = token.name as string;
      }
      if (token.businessName && session.user) {
        session.user.businessName = token.businessName; // Add businessName to session.user
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
