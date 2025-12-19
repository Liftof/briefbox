'use client';

import { useRef, useState, useEffect } from 'react';

const IMAGES = [2, 3, 4, 6, 8, 9];

export default function Gallery() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeft(scrollRef.current.scrollLeft);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 2; // Scroll speed
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    return (
        <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className={`flex gap-8 overflow-x-auto pb-8 scrollbar-hide select-none transition-cursor duration-200 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'
                }`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>

            {IMAGES.map((i) => (
                <div key={i} className="w-72 md:w-[480px] flex-shrink-0">
                    <div className="aspect-square bg-gray-100 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.01] border border-gray-100">
                        <img
                            src={`/gallery/gal-${i}.${i === 9 ? 'jpg' : 'png'}`}
                            alt={`Visuel créé avec Palette ${i}`}
                            className="w-full h-full object-cover pointer-events-none"
                        />
                    </div>
                </div>
            ))}

            {/* Spacer for end of scroll */}
            <div className="w-8 md:w-32 flex-shrink-0" />
        </div>
    );
}
