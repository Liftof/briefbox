'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

const headlines = [
  {
    fr: { line1: "Plus simple que d'expliquer", line2: 'à votre stagiaire' },
    en: { line1: 'Simpler than explaining', line2: 'to your intern' }
  },
  {
    fr: { line1: 'Plus simple', line2: "qu'une réunion de cadrage" },
    en: { line1: 'Simpler than', line2: 'a kickoff meeting' }
  }
];

export default function RotatingHeadline() {
  const { locale } = useTranslation();
  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % headlines.length);
        setIsAnimating(false);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const current = headlines[index][locale] || headlines[index].en;

  return (
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 leading-tight mb-6">
      <span className={`block transition-all duration-300 ${isAnimating ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'}`}>
        {current.line1}
      </span>
      <span className={`block font-semibold transition-all duration-300 delay-75 ${isAnimating ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'}`}>
        {current.line2}
      </span>
    </h2>
  );
}
