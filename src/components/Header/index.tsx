'use client';

import { useState, useEffect } from 'react'; // Combined import
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import styles from './Header.module.css';
import UserDropdown from '@/components/UserDropdown/index';

export default function Header() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Add state for mobile menu
  const [currentBusinessName, setCurrentBusinessName] = useState('Cargando...'); // New state for business name

  useEffect(() => {
    const fetchBusinessName = async () => {
      if (status === 'authenticated') {
        try {
          const res = await fetch('/api/user/business');
          if (res.ok) {
            const data = await res.json();
            setCurrentBusinessName(data.businessName || 'Boost Your Business');
          } else {
            console.error('Failed to fetch business name:', res.status, res.statusText);
            setCurrentBusinessName('Boost Your Business'); // Fallback on error
          }
        } catch (error) {
          console.error('Error fetching business name:', error);
          setCurrentBusinessName('Boost Your Business'); // Fallback on network error
        }
      } else if (status === 'unauthenticated') {
        setCurrentBusinessName('Boost Your Business'); // Default for unauthenticated
      }
    };

    fetchBusinessName();
  }, [status]); // Re-run when authentication status changes

  const toggleMenu = () => {
    console.log('Toggling mobile menu. Current state:', isMenuOpen); // Debug log
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
              <Link href="/pos">
                POS
              </Link>
            </li>
            <li>
              <Link href="/products">
                Productos
              </Link>
            </li>
            <li>
              <Link href="/combos">
                Combos
              </Link>
            </li>
            <li>
              <Link href="/sales-report">
                Ventas
              </Link>
            </li>
            <li>
              <Link href="/summary-report">
                Reportes
              </Link>
            </li>
          </ul>
        </nav>

        {/* Center: Business Name */}
        <div className={styles.desktopBusinessName}>
          <span>
            {currentBusinessName}
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
              {currentBusinessName}
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
              <Link href="/pos" onClick={closeMenu}>
                POS
              </Link>
            </li>
            <li>
              <Link href="/products" onClick={closeMenu}>
                Productos
              </Link>
            </li>
            <li>
              <Link href="/combos" onClick={closeMenu}>
                Combos
              </Link>
            </li>
            <li>
              <Link href="/sales-report" onClick={closeMenu}>
                Ventas
              </Link>
            </li>
            <li>
              <Link href="/summary-report" onClick={closeMenu}>
                Reportes
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}


