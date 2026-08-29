'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock } from 'lucide-react';
import styles from './navigation.module.css';

const tabs = [
  { href: '/text-compare', label: 'Text Compare' },
  { href: '/excel-compare', label: 'Excel Compare' },
] as const;

const PRIVACY_DETAIL =
  'Your text, code, and spreadsheets are processed locally in this browser. Nothing is uploaded.';

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
      {/* A quiet, permanent badge rather than a banner: the trust signal stays on
          screen without spending a strip of vertical space on every page. */}
      <span className={styles.privacy} title={PRIVACY_DETAIL}>
        <Lock className={styles.privacyIcon} size={12} aria-hidden="true" />
        <span className={styles.privacyLabel} aria-hidden="true">Local only</span>
        <span className={styles.srOnly}>{PRIVACY_DETAIL}</span>
      </span>
    </nav>
  );
}
