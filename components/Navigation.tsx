'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className={`mx-auto max-w-7xl px-6 transition-all duration-300 ${isScrolled ? 'py-4' : 'py-6'}`}>
          <div className={`flex items-center justify-between px-6 py-3 transition-all duration-300 ${
            isScrolled 
              ? 'bg-white/80 backdrop-blur-xl border border-gray-200 shadow-sm' 
              : 'bg-transparent'
          }`}>
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center">
                <span className="text-white text-[9px] font-semibold">P</span>
              </div>
              <span className="text-gray-900 font-medium text-sm">Palette</span>
            </Link>

            {/* Desktop menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#fonctionnement" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Fonctionnement
              </a>
              <a href="#tarifs" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                Tarifs
              </a>
              
              <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
                {isLoaded && (
                  <>
                    {isSignedIn ? (
                      <UserButton afterSignOutUrl="/" />
                    ) : (
                      <SignInButton mode="modal">
                        <button className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                          Connexion
                        </button>
                      </SignInButton>
                    )}
                  </>
                )}
                
                <Link
                  href="/playground"
                  className="group inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium hover:bg-black transition-colors"
                >
                  <span>Playground</span>
                  <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden w-8 h-8 flex items-center justify-center"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menu"
            >
              <div className="flex flex-col gap-1">
                <span className={`block w-4 h-[1.5px] bg-gray-900 transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-[5px]' : ''}`} />
                <span className={`block w-4 h-[1.5px] bg-gray-900 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`block w-4 h-[1.5px] bg-gray-900 transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-[5px]' : ''}`} />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white md:hidden pt-24 px-6 animate-fade-in">
          <div className="flex flex-col">
            <a
              href="#fonctionnement"
              className="py-4 text-lg text-gray-900 border-b border-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              Fonctionnement
            </a>
            <a
              href="#tarifs"
              className="py-4 text-lg text-gray-900 border-b border-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              Tarifs
            </a>
            
            <div className="py-4 flex items-center justify-between border-b border-gray-100">
              <span className="text-lg text-gray-900">Compte</span>
              {isSignedIn ? (
                <UserButton afterSignOutUrl="/" />
              ) : (
                <SignInButton mode="modal">
                  <button className="text-gray-900 font-medium">Connexion</button>
                </SignInButton>
              )}
            </div>

            <Link
              href="/playground"
              className="mt-8 py-4 text-center bg-gray-900 text-white text-sm font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Playground →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
