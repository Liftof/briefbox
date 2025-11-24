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
      <nav className={`fixed top-6 left-0 right-0 z-50 transition-all duration-500 pointer-events-none flex justify-center`}>
        <div className={`bg-white/80 backdrop-blur-md border border-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-full px-6 py-3 max-w-5xl w-[calc(100%-3rem)] pointer-events-auto transition-all duration-300 ${isScrolled ? 'translate-y-0' : 'translate-y-0'}`}>
          <div className="flex items-center justify-between">
            {/* Logo raffiné */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
                  <span className="text-white text-[10px] font-semibold tracking-tight">Q</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-primary font-semibold text-sm tracking-tight leading-none">QuitteTonAgence</span>
              </div>
            </Link>

            {/* Desktop menu */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-1 bg-secondary/5 rounded-full p-1 mr-4">
                  <a
                    href="#fonctionnement"
                    className="text-[13px] text-secondary/80 hover:text-primary px-4 py-1.5 rounded-full hover:bg-white transition-all duration-300 font-medium"
                  >
                    Fonctionnement
                  </a>
                  <a
                    href="#tarifs"
                    className="text-[13px] text-secondary/80 hover:text-primary px-4 py-1.5 rounded-full hover:bg-white transition-all duration-300 font-medium"
                  >
                    Tarifs
                  </a>
              </div>

              {/* CTA élégant */}
              <Link
                href="/playground"
                className="group inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-[13px] font-medium rounded-full hover:opacity-90 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <span>Playground</span>
                <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>

              {/* Auth */}
              {isLoaded && (
                <div className="pl-4 border-l border-gray-200 flex items-center">
                  {isSignedIn ? (
                    <UserButton afterSignOutUrl="/" />
                  ) : (
                    <SignInButton mode="modal">
                      <button className="text-[13px] font-medium text-primary hover:bg-gray-100 px-3 py-2 rounded-full transition-colors">
                        Connexion
                      </button>
                    </SignInButton>
                  )}
                </div>
              )}
            </div>

            {/* Mobile menu button - raffiné */}
            <button
              className="md:hidden relative w-9 h-9 flex items-center justify-center group"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menu"
            >
              <div className="flex flex-col gap-[5px]">
                <span className={`block w-4 h-[1.5px] bg-primary transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-[6.5px]' : ''}`}></span>
                <span className={`block w-4 h-[1.5px] bg-primary transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block w-4 h-[1.5px] bg-primary transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-[6.5px]' : ''}`}></span>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {isMenuOpen && (
          <div className="fixed inset-0 z-40 bg-white/95 backdrop-blur-xl md:hidden pt-24 px-6 animate-fade-in">
            <div className="flex flex-col gap-2">
              <a
                href="#fonctionnement"
                className="block text-lg text-primary font-semibold py-4 border-b border-stroke"
                onClick={() => setIsMenuOpen(false)}
              >
                Fonctionnement
              </a>
              <a
                href="#tarifs"
                className="block text-lg text-primary font-semibold py-4 border-b border-stroke"
                onClick={() => setIsMenuOpen(false)}
              >
                Tarifs
              </a>
              
              <div className="py-4 flex items-center justify-between border-b border-stroke">
                 <span className="text-lg font-semibold">Compte</span>
                 {isSignedIn ? (
                    <UserButton afterSignOutUrl="/" />
                 ) : (
                    <SignInButton mode="modal">
                        <button className="text-primary font-bold">Connexion</button>
                    </SignInButton>
                 )}
              </div>

              <Link
                href="/playground"
                className="block w-full px-4 py-4 mt-8 text-center bg-primary text-white text-base font-medium rounded-full shadow-lg"
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

