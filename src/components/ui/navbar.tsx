'use client'
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

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
  { id: 'text', label: 'Text', href: '/text-compare' },
  { id: 'excel', label: 'Excel', href: '/excel-compare' },
];

export const Navbar = ({ items = defaultNavItems, className = '' }: NavbarProps) => {
  const pathname = usePathname();

  return (
    <nav className={`w-full max-w-screen-lg flex flex-wrap items-center px-2 py-4 text-md ${className}`}>
      
      <Link href="/" className="shrink-0" aria-label="Home">
        <Image src="/logo.svg" alt="Diffchecker logo" width={150} height={150} priority />
      </Link> 
      {items.map((item) => {
        const isActive = pathname === item.href || 
          (item.href !== '/' && pathname.startsWith(item.href));
        
        return (
          <Link
            key={item.id}
            href={item.href}
            target={item.target}
            rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
            className={` font-bold py-2 px-2 mx-2 sm:px-4 rounded-md transition-colors duration-150 ease-in-out whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-ring ${
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