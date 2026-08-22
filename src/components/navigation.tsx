'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './navigation.module.css';

const tabs = [
  { href: '/text-compare', label: 'Text Compare' },
  { href: '/excel-compare', label: 'Excel Compare' },
] as const;

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className={styles.navigation} aria-label="Comparison tools">
      <span className={styles.brand}>DIFFCHECKER</span>
      <div className={styles.tabs}>
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (pathname === '/' && tab.href === '/text-compare');
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`${styles.tab} ${isActive ? styles.active : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
