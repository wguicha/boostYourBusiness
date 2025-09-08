'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/app/auth/actions';
import { signIn } from 'next-auth/react';
import styles from './signup.module.css'; // Import CSS module

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await registerUser(new FormData(e.currentTarget as HTMLFormElement));
      setSuccess('¡Registro exitoso! Redirigiendo para iniciar sesión...');
      // Optionally sign in the user directly after registration
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/products'); // Redirect to products page on successful login
      }
    } catch (error: unknown) {
      console.error('Error during signup:', error);
      alert('Error during signup. Please try again.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h2 className={styles.title}>Registrarse</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className={styles.messageError}>{error}</p>}
          {success && <p className={styles.messageSuccess}>{success}</p>}
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.formGroupLast}>
            <label htmlFor="password" className={styles.label}>Contraseña:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              required
            />
          </div>
          <button
            type="submit"
            className={styles.button}
          >
            Registrarse
          </button>
        </form>
        <p className={styles.linkText}>
          ¿Ya tienes cuenta? <a href="/auth/signin" className={styles.link}>Inicia sesión aquí</a>
        </p>
      </div>
    </div>
  );
}
