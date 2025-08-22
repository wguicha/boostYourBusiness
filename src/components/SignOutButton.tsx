'use client';

import { signOut } from 'next-auth/react';

export default function SignOutButton() {
  return (
    <button 
      onClick={() => signOut({ callbackUrl: '/auth/signin' })}
      className="bg-red-500 hover:bg-red-700 text-white text-sm py-1 px-3 rounded"
    >
      Cerrar Sesión
    </button>
  );
}
