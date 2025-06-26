'use client'
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface NavItem {
  id: string;
  label: string;
  href: string;
  target?: string;
}

interface NavbarProps {
  items?: NavItem[];
  className?: string;
}

const defaultNavItems: NavItem[] = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'text', label: 'Text', href: '/text-compare' },
  { id: 'excel', label: 'Excel', href: '/excel-compare' },
];

export const Navbar = ({ items = defaultNavItems, className = '' }: NavbarProps) => {
  const pathname = usePathname();

  return (
    <nav className={`w-full max-w-screen-md mx-auto flex flex-wrap justify-center sm:justify-between items-center px-4 sm:px-8 py-4 text-sm ${className}`}>
      {items.map((item) => {
        const isActive = pathname === item.href || 
          (item.href !== '/' && pathname.startsWith(item.href));
        
        return (
          <Link
            key={item.id}
            href={item.href}
            target={item.target}
            rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
            className={` font-bold py-2 px-3 sm:px-4 rounded-md transition-colors duration-150 ease-in-out whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-ring ${
              isActive 
                ? 'text-foreground bg-green-500/20 border border-accent/30' 
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/10 dark:hover:bg-accent/20'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};