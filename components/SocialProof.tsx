'use client';

import { useState, useEffect } from 'react';

export default function SocialProof() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Generate random number between 150 and 1800
    const randomCount = Math.floor(Math.random() * (1800 - 150 + 1)) + 150;
    setCount(randomCount);
  }, []);

  if (count === 0) return null; // Avoid hydration mismatch

  return (
    <div className="inline-flex items-center gap-3 bg-white border border-gray-200 px-4 py-2 shadow-sm">
      <div className="flex -space-x-1">
        <div className="w-2 h-2 bg-red-500 rounded-full" />
        <div className="w-2 h-2 bg-blue-500 rounded-full" />
        <div className="w-2 h-2 bg-amber-400 rounded-full" />
      </div>
      <span className="text-sm text-gray-600">
        <span className="font-semibold text-gray-900">{count.toLocaleString('fr-FR')}</span> visuels générés aujourd'hui
      </span>
    </div>
  );
}

