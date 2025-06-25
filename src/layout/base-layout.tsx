'use client'
import { ReactNode } from 'react';
import { Navbar } from '@/components/ui/navbar';

interface NavItem {
  id: string;
  label: string;
  href: string;
  target?: string;
}

interface BaseLayoutProps {
  children: ReactNode;
  navItems?: NavItem[];
  showNavbar?: boolean;
  className?: string;
}

export const BaseLayout = ({ 
  children, 
  navItems, 
  showNavbar = true, 
  className = '' 
}: BaseLayoutProps) => {
  return (
    <div className={`bg-background text-foreground min-h-screen flex flex-col ${className}`}>
      {showNavbar && <Navbar items={navItems} />}
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
};