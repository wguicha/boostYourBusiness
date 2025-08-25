'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createBusinessForUser } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="w-full rounded-md bg-blue-500 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
      {pending ? 'Creando Negocio...' : 'Crear Negocio'}
    </button>
  );
}

export default function OnboardingPage() {
  const [state, formAction] = useFormState(createBusinessForUser, { message: '' });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-4 text-center text-2xl font-bold">Crea tu Negocio</h1>
        <p className="mb-6 text-center text-gray-600">Para empezar a usar la aplicación, necesitas crear un negocio.</p>
        <form action={formAction}>
          <div className="mb-4">
            <label htmlFor="businessName" className="mb-2 block text-sm font-bold text-gray-700">Nombre del Negocio:</label>
            <input
              type="text"
              id="businessName"
              name="businessName"
              className="w-full rounded-md border px-3 py-2 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>
          {state?.message && <p className="mb-4 text-center text-red-500">{state.message}</p>}
          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
