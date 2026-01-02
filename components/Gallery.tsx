'use client';

import { useRef, useState, useEffect } from 'react';

// Images with their aspect ratios: 'square' (1:1), 'portrait' (4:5), 'landscape' (3:2)
const IMAGES: { id: number; ext: string; ratio: 'square' | 'portrait' | 'landscape' }[] = [
    { id: 10, ext: 'webp', ratio: 'portrait' },
    { id: 2, ext: 'webp', ratio: 'portrait' },
    { id: 15, ext: 'webp', ratio: 'square' },
    { id: 3, ext: 'webp', ratio: 'portrait' },
    { id: 11, ext: 'webp', ratio: 'portrait' },
    { id: 4, ext: 'webp', ratio: 'square' },
    { id: 12, ext: 'webp', ratio: 'portrait' },
    { id: 16, ext: 'webp', ratio: 'square' },
    { id: 6, ext: 'webp', ratio: 'portrait' },
    { id: 13, ext: 'webp', ratio: 'portrait' },
    { id: 8, ext: 'webp', ratio: 'landscape' },
    { id: 14, ext: 'webp', ratio: 'portrait' },
    { id: 9, ext: 'webp', ratio: 'portrait' },
];

const ASPECT_CLASSES = {
    square: 'aspect-square',
    portrait: 'aspect-[4/5]',
    landscape: 'aspect-[3/2]',
};

export default function Gallery() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    // Auto-scroll effect
    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        let animationId: number;
        let scrollSpeed = 0.5; // pixels per frame

        const animate = () => {
            if (!isPaused && !isDragging && container) {
                container.scrollLeft += scrollSpeed;

                // Reset to start when reaching the end (infinite loop effect)
                const maxScroll = container.scrollWidth - container.clientWidth;
                if (container.scrollLeft >= maxScroll) {
                    container.scrollLeft = 0;
                }
            }
            animationId = requestAnimationFrame(animate);
        };

        animationId = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationId);
    }, [isPaused, isDragging]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeft(scrollRef.current.scrollLeft);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
        setIsPaused(false);
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

    const handleMouseEnter = () => {
        setIsPaused(true);
    };

    return (
        <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            className={`flex gap-8 overflow-x-auto pb-8 scrollbar-hide select-none transition-cursor duration-200 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'
                }`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>

            {IMAGES.map((img) => (
                <div key={img.id} className="h-56 md:h-72 flex-shrink-0">
                    <div className={`h-full ${ASPECT_CLASSES[img.ratio]} bg-gray-100 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02] border border-gray-100`}>
                        <img
                            src={`/gallery/gal-${img.id}.${img.ext}`}
                            alt={`Visuel créé avec Palette ${img.id}`}
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
