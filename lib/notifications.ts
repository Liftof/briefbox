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
function playNotificationSound(type: 'brand' | 'visual' | 'default' = 'default') {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Frequencies for a C Major arpeggio
        // C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.50
        const arpeggio = [523.25, 659.25, 783.99, 1046.50];

        // Adjust sequence based on type
        let notes = arpeggio;
        let speed = 0.08;
        let gainValue = 0.2;

        if (type === 'brand') {
            notes = [523.25, 783.99, 1046.50]; // Bright discovery
            speed = 0.12;
        } else if (type === 'visual') {
            notes = [659.25, 783.99, 1046.50, 1318.51]; // Higher achievement
            speed = 0.07;
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
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * speed + 0.3);

            oscillator.start(now + i * speed);
            oscillator.stop(now + i * speed + 0.3);
        });
    } catch (e) {
        console.log('Sound notification not available');
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
    brandReady: (brandName?: string) => {
        showBrowserNotification('🎨 Marque analysée !', {
            body: brandName ? `${brandName} est prête` : 'Cliquez pour voir',
            playSound: true,
            soundType: 'brand',
        });
    },

    // Visual generation completed
    visualReady: (count: number = 1) => {
        showBrowserNotification('✨ Visuel prêt !', {
            body: count > 1 ? `${count} visuels générés` : 'Votre création est prête',
            playSound: true,
            soundType: 'visual',
        });
    },

    // Error notification
    error: (message: string) => {
        showBrowserNotification('⚠️ Erreur', {
            body: message,
            playSound: true,
            soundType: 'default',
        });
    },
};
