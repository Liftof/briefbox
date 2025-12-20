'use client';

import { useState } from 'react';

interface I18nComparisonProps {
    locale: string;
}

export default function I18nComparison({ locale }: I18nComparisonProps) {
    const [activeSide, setActiveSide] = useState<'fr' | 'en'>('en');

    return (
        <div className="bg-white rounded-3xl border border-gray-100 p-4 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <div className="flex gap-2 p-1 bg-gray-50 rounded-xl border border-gray-100">
                    <button
                        onClick={() => setActiveSide('fr')}
                        className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${activeSide === 'fr'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        Français
                    </button>
                    <button
                        onClick={() => setActiveSide('en')}
                        className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${activeSide === 'en'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        English
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900 leading-none">20s</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider">{locale === 'fr' ? 'Export' : 'Export'}</div>
                    </div>
                    <div className="w-px h-8 bg-gray-100" />
                    <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900 leading-none">100%</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider">{locale === 'fr' ? 'Fidèle' : 'Consistent'}</div>
                    </div>
                </div>
            </div>

            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                <div className={`absolute inset-0 transition-opacity duration-500 ${activeSide === 'fr' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                    <img
                        src="/gallery/i18n-fr.jpg"
                        alt="French version"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-md rounded-lg text-xs font-bold text-gray-900 shadow-xl border border-white">
                        FR
                    </div>
                </div>

                <div className={`absolute inset-0 transition-opacity duration-500 ${activeSide === 'en' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                    <img
                        src="/gallery/i18n-en.jpg"
                        alt="English version"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 px-3 py-1 bg-blue-500 rounded-lg text-xs font-bold text-white shadow-xl">
                        EN
                    </div>
                </div>

                {/* Comparison Hint */}
                <div className="absolute bottom-4 inset-x-4 flex justify-center">
                    <div className="px-3 py-1.5 bg-gray-900/10 backdrop-blur-md rounded-full text-[10px] text-gray-600 font-medium">
                        {locale === 'fr' ? 'Cliquez pour comparer' : 'Click to compare'}
                    </div>
                </div>
            </div>
        </div>
    );
}
