'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import styles from './Header.module.css';
import UserDropdown from '@/components/UserDropdown/index';
import BusinessSwitcher from '@/components/BusinessSwitcher/index'; // Import the new component

export default function Header() {
  const { status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Only show the main header content if the user is authenticated
  if (status !== 'authenticated') {
    return (
      <header className={`${styles.header}`}>
        <div className={styles.desktopHeaderContainer}>
          <div className={styles.desktopBusinessName}>
            <span>Boost Your Business</span>
          </div>
          <div className={styles.desktopUserIcon}>
            <UserDropdown />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={`${styles.header}`}>
      {/* Desktop Layout */}
      <div className={styles.desktopHeaderContainer}>
        {/* Left: Desktop Menu */}
        <nav className={styles.desktopMenuNav}>
          <ul>
            <li><Link href="/pos">POS</Link></li>
            <li><Link href="/products">Productos</Link></li>
            <li><Link href="/combos">Combos</Link></li>
            <li><Link href="/sales-report">Ventas</Link></li>
            <li><Link href="/summary-report">Reportes</Link></li>
          </ul>
        </nav>

        {/* Center: Business Switcher */}
        <div className={styles.desktopBusinessName}>
          <BusinessSwitcher />
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

          {/* Center: Business Switcher (on mobile) */}
          <div className={styles.mobileBusinessName}>
            <BusinessSwitcher />
          </div>

          {/* Right: User Icon/Dropdown */}
          <div className={styles.mobileUserIcon}>
            <UserDropdown />
          </div>
        </div>

        {/* Collapsible Menu (only visible on mobile when open) */}
        <nav className={`${styles.navMenu} ${isMenuOpen ? styles.navMenuOpen : ''}`}>
          <ul>
            <li><Link href="/pos" onClick={closeMenu}>POS</Link></li>
            <li><Link href="/products" onClick={closeMenu}>Productos</Link></li>
            <li><Link href="/combos" onClick={closeMenu}>Combos</Link></li>
            <li><Link href="/sales-report" onClick={closeMenu}>Ventas</Link></li>
            <li><Link href="/summary-report" onClick={closeMenu}>Reportes</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}


