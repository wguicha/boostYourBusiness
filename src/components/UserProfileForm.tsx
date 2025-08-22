'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateUserProfile } from '@/app/auth/actions';
import { useSession } from 'next-auth/react'; // Import useSession

interface UserProfileFormProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    businessName: string | null;
  };
}

export default function UserProfileForm({ user }: UserProfileFormProps) {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();
  const { update } = useSession(); // Get the update function

  const handleSubmit = async (formData: FormData) => {
    setMessage(null);
    try {
      await updateUserProfile(user.id, formData);
      setMessage({ type: 'success', text: 'Perfil actualizado con éxito!' });
      await update(); // Refresh the session
    } catch (error: any) {
      console.error('Error al actualizar el perfil:', error);
      setMessage({ type: 'error', text: `Error: ${error.message || 'Error desconocido'}` });
    }
  };

  return (
    <form action={handleSubmit} className="p-4 border rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-4">Editar Perfil</h2>
      {message && (
        <div className={`p-2 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}
      <div className="mb-4">
        <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">Nombre:</label>
        <input type="text" id="name" name="name" defaultValue={user.name || ''} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
      </div>
      <div className="mb-4">
        <label htmlFor="businessName" className="block text-gray-700 text-sm font-bold mb-2">Nombre del Negocio:</label>
        <input type="text" id="businessName" name="businessName" defaultValue={user.businessName || ''} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
      </div>
      <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
        Guardar Cambios
      </button>
    </form>
  );
}