'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

export default function Header() {
  const { data: session } = useSession();
  console.log('Header Session:', session); // Add this line for debugging

  return (
    <header className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          Boost Your Business
        </Link>
        <nav>
          <ul className="flex space-x-4 items-center">
            <li>
              <Link href="/products" className="hover:underline">
                Productos
              </Link>
            </li>
            <li>
              <Link href="/pos" className="hover:underline">
                POS
              </Link>
            </li>
            <li>
              <Link href="/profile" className="hover:underline">
                Mi Perfil
              </Link>
            </li>
            {/* Add more links here as needed */}
            {session ? (
              <li className="ml-4">
                <span className="text-sm">Hola, {session.user?.name || session.user?.email}!</span>
                {session.user?.businessName && (
                  <span className="text-xs ml-2">({session.user.businessName})</span>
                )}
                <button 
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                  className="ml-2 bg-red-500 hover:bg-red-700 text-white text-sm py-1 px-2 rounded"
                >
                  Cerrar Sesión
                </button>
              </li>
            ) : (
              <li>
                <Link href="/auth/signin" className="bg-blue-700 hover:bg-blue-800 text-white text-sm py-1 px-2 rounded">
                  Iniciar Sesión
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
