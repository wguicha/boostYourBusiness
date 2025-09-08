'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './signin.module.css'; // Import CSS module

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      // The error message from the server is intentionally generic for security.
      // We display a user-friendly message instead of the technical error code.
      setError('Email o contraseña incorrectos. Por favor, inténtalo de nuevo.');
    } else {
      router.push('/pos'); // Redirect to POS page on successful login
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <form onSubmit={handleSubmit}>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Email:</label>
            <input
              type="email"
              id="email"
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
            Iniciar Sesión
          </button>
        </form>
        <p className={styles.linkText}>
          ¿No tienes cuenta? <a href="/auth/signup" className={styles.link}>Regístrate aquí</a>
        </p>
        {/* <p className={`${styles.linkText} mt-2`}>
          <a href="/auth/forgot-password" className={styles.link}>¿Olvidaste tu contraseña?</a>
        </p> */}
      </div>
    </div>
  );
}
