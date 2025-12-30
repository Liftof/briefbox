'use client';

// ═══════════════════════════════════════════════════════════════════════════
// PALETTE - Browser Notifications Utility
// Shows native browser notifications when long operations complete
// ═══════════════════════════════════════════════════════════════════════════

// Request permission on first use
export async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
        console.warn('Browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission === 'denied') {
        return false;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

// Play a joyful notification sound
async function playNotificationSound(type: 'brand' | 'visual' | 'default' = 'default') {
    try {
        console.log('🔊 Attempting to play notification sound:', type);
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Resume AudioContext if suspended (required by browsers)
        if (audioContext.state === 'suspended') {
            console.log('🔊 AudioContext was suspended, resuming...');
            await audioContext.resume();
        }

        // Frequencies for a C Major arpeggio
        // C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.50
        const arpeggio = [523.25, 659.25, 783.99, 1046.50];

        // Adjust sequence based on type
        let notes = arpeggio;
        let speed = 0.12;
        let gainValue = 0.3; // Increased volume

        if (type === 'brand') {
            notes = [523.25, 783.99, 1046.50]; // Bright discovery
            speed = 0.15; // Slower for clarity
            gainValue = 0.4; // Louder
        } else if (type === 'visual') {
            notes = [659.25, 783.99, 1046.50, 1318.51]; // Higher achievement
            speed = 0.1;
            gainValue = 0.4; // Louder
        }

        const now = audioContext.currentTime;

        notes.forEach((freq, i) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, now + i * speed);

            // Soft envelope
            gainNode.gain.setValueAtTime(0, now + i * speed);
            gainNode.gain.linearRampToValueAtTime(gainValue, now + i * speed + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * speed + 0.4);

            oscillator.start(now + i * speed);
            oscillator.stop(now + i * speed + 0.4);
        });

        console.log('✅ Sound played successfully');
    } catch (e) {
        console.error('❌ Sound notification error:', e);
    }
}

// Show a browser notification
export function showBrowserNotification(
    title: string,
    options?: {
        body?: string;
        icon?: string;
        playSound?: boolean;
        soundType?: 'brand' | 'visual' | 'default';
        onClick?: () => void;
    }
) {
    const { body, icon = '/logo-icon.png', playSound = true, soundType = 'default', onClick } = options || {};

    // Play sound if enabled
    if (playSound) {
        playNotificationSound(soundType);
    }

    // Check permission
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        console.log('Notification (no permission):', title, body);
        return;
    }

    try {
        const notification = new Notification(title, {
            body,
            icon,
            badge: icon,
            tag: 'palette-notification', // Replace previous notification
            requireInteraction: false,
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
            onClick?.();
        };

        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);
    } catch (e) {
        console.error('Failed to show notification:', e);
    }
}

// Convenience methods for common notifications
export const notify = {
    // Brand scraping completed
    brandReady: (brandName?: string, locale: 'fr' | 'en' = 'fr') => {
        const title = locale === 'fr' ? '🎨 Marque analysée !' : '🎨 Brand analyzed!';
        const body = brandName
            ? (locale === 'fr' ? `${brandName} est prête` : `${brandName} is ready`)
            : (locale === 'fr' ? 'Cliquez pour voir' : 'Click to view');

        showBrowserNotification(title, {
            body,
            playSound: true,
            soundType: 'brand',
        });
    },

    // Visual generation completed
    visualReady: (count: number = 1, locale: 'fr' | 'en' = 'fr') => {
        const title = locale === 'fr' ? '✨ Visuel prêt !' : '✨ Visual ready!';
        const body = count > 1
            ? (locale === 'fr' ? `${count} visuels générés` : `${count} visuals generated`)
            : (locale === 'fr' ? 'Votre création est prête' : 'Your creation is ready');

        showBrowserNotification(title, {
            body,
            playSound: true,
            soundType: 'visual',
        });
    },

    // Error notification
    error: (message: string, locale: 'fr' | 'en' = 'fr') => {
        const title = locale === 'fr' ? '⚠️ Erreur' : '⚠️ Error';

        showBrowserNotification(title, {
            body: message,
            playSound: true,
            soundType: 'default',
        });
    },
};
