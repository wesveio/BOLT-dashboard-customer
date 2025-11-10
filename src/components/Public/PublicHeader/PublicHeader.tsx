'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';

interface PublicHeaderProps {
  showDashboard?: boolean;
}

export function PublicHeader({ showDashboard = false }: PublicHeaderProps) {
  const t = useTranslations('public.header.navigation');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/pricing', label: t('pricing') },
    { href: '/login', label: t('login') },
    ...(showDashboard ? [{ href: '/dashboard', label: t('dashboard') }] : []),
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(href);
  };

  const headerClasses = `sticky top-0 z-50 transition-all duration-200 ${
    isScrolled
      ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-gray-100'
      : 'bg-white/80 backdrop-blur-sm border-b border-gray-100'
  }`;

  return (
    <header className={`${headerClasses} animate-fade-in`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center transition-opacity duration-200 hover:opacity-80"
            aria-label="Bolt - Go to homepage"
          >
            <div className="relative h-4 w-auto md:h-5 flex items-center">
              <Image
                src="/bolt.svg"
                alt="Bolt Logo"
                width={68}
                height={23}
                className="h-full w-auto object-contain"
                style={{
                  filter: 'brightness(0)',
                }}
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isLoginLink = link.href === '/login';
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-semibold transition-all duration-200 relative ${
                    isLoginLink
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:-translate-y-0.5 transform'
                      : isActive(link.href)
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  {link.label}
                  {!isLoginLink && isActive(link.href) && (
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300" />
                  )}
                </Link>
              );
            })}
      </nav>

      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200"
        aria-label="Toggle menu"
        aria-expanded={isMenuOpen}
      >
          {isMenuOpen ? (
          <svg
            className="w-6 h-6 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
          </svg>
          ) : (
          <svg
            className="w-6 h-6 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
          </svg>
          )}
      </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden animate-fade-in"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Slide-out Menu */}
          <nav className="fixed top-16 right-0 bottom-0 w-64 bg-white shadow-xl z-50 md:hidden overflow-y-auto animate-slide-in-right">
            <div className="flex flex-col p-6 gap-4 stagger-container">
              {navLinks.map((link) => {
                const isLoginLink = link.href === '/login';
                return (
                  <div key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`block py-3 px-4 rounded-lg text-base font-semibold transition-all duration-200 ${
                        isLoginLink
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-center'
                          : isActive(link.href)
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </div>
                );
              })}
            </div>
          </nav>
        </>
      )}
    </header>
  );
}

