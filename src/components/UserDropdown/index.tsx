'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import styles from './UserDropdown.module.css';

export default function UserDropdown() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const user = session?.user;
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : user?.email ? user.email[0].toUpperCase() : '?';

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!session) {
    return (
      <Link href="/auth/signin" className="bg-blue-700 hover:bg-blue-800 text-sm py-1 px-2 rounded">
        Iniciar Sesión
      </Link>
    );
  }

  return (
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      <button className={styles.userIcon} onClick={toggleDropdown}>
        {initials}
      </button>
      {isOpen && (
        <div className={styles.dropdownMenu}>
          <p className={styles.dropdownItem}>Hola, {user?.name || user?.email}!</p>
          {user?.email && <p className={styles.dropdownItem}>{user.email}</p>}
          {user?.businessName && <p className={styles.dropdownItem}>({user.businessName})</p>}
          <Link href="/profile" className={styles.dropdownItem} onClick={() => setIsOpen(false)}>
            Mi Perfil
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className={`${styles.dropdownItem} ${styles.logoutButton}`}
          >
            Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
}
