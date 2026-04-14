'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/text-compare', label: 'Text Compare' },
  { href: '/excel-compare', label: 'Excel Compare' },
] as const;

export default function Navigation() {
  const pathname = usePathname();

  return (
    <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-separator)' }}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              padding: '0.5rem 1rem',
              marginRight: '1rem',
              border: 'none',
              borderRadius: 'var(--border-radius)',
              backgroundColor: isActive ? 'var(--color-primary)' : 'var(--color-widget-background)',
              color: isActive ? 'var(--color-widget-background)' : 'var(--color-text-base)',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
