'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import styles from './Header.module.css';
import UserDropdown from '@/components/UserDropdown/index';

export default function Header() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Add state for mobile menu
  console.log('Header Session:', session); // Add this line for debugging

  const businessNameDisplay = status === 'loading' 
    ? 'Cargando...' 
    : (session?.user?.businessName || 'Boost Your Business');

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className={`${styles.header}`}>
      {/* Desktop Layout */}
      <div className={styles.desktopHeaderContainer}>
        {/* Left: Desktop Menu */}
        <nav className={styles.desktopMenuNav}>
          <ul>
            <li>
              <Link href="/products">
                Productos
              </Link>
            </li>
            <li>
              <Link href="/pos">
                POS
              </Link>
            </li>
            <li>
              <Link href="/sales-report">
                Reportes
              </Link>
            </li>
          </ul>
        </nav>

        {/* Center: Business Name */}
        <div className={styles.desktopBusinessName}>
          <span>
            {businessNameDisplay}
          </span>
        </div>

        {/* Right: User Icon/Dropdown */}
        <div className={styles.desktopUserIcon}>
          <UserDropdown />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className={styles.mobileHeaderContainer}>
        {/* Top Row for Mobile: Menu Icon, Business Name, User Icon */}
        <div className={styles.mobileTopRow}>
          {/* Left: Mobile Toggle */}
          <div className={`${styles.menuContainer}`}>
            <button className={styles.mobileMenuButton} onClick={toggleMenu}>
              <span className={styles.hamburgerLine}></span>
              <span className={styles.hamburgerLine}></span>
              <span className={styles.hamburgerLine}></span>
            </button>
          </div>

          {/* Center: Business Name (on mobile, part of this row) */}
          <div className={styles.mobileBusinessName}>
            <span>
              {businessNameDisplay}
            </span>
          </div>

          {/* Right: User Icon/Dropdown */}
          <div className={styles.mobileUserIcon}>
            <UserDropdown />
          </div>
        </div>

        {/* Collapsible Menu (only visible on mobile when open) */}
        <nav className={`${styles.navMenu} ${isMenuOpen ? styles.navMenuOpen : ''}`}>
          <ul>
            <li>
              <Link href="/products" onClick={closeMenu}>
                Productos
              </Link>
            </li>
            <li>
              <Link href="/pos" onClick={closeMenu}>
                POS
              </Link>
            </li>
            <li>
              <Link href="/sales-report" onClick={closeMenu}>
                Reportes
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}


