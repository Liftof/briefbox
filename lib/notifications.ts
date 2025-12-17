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

// Play a subtle notification sound
function playNotificationSound() {
    try {
        // Create a subtle "ding" sound using Web Audio API
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Gentle bell-like sound
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
        oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.1); // A4

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.type = 'sine';
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        // Fallback: silent if Web Audio not available
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
        onClick?: () => void;
    }
) {
    const { body, icon = '/logo-icon.png', playSound = true, onClick } = options || {};

    // Play sound if enabled
    if (playSound) {
        playNotificationSound();
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
        });
    },

    // Visual generation completed
    visualReady: (count: number = 1) => {
        showBrowserNotification('✨ Visuel prêt !', {
            body: count > 1 ? `${count} visuels générés` : 'Votre création est prête',
            playSound: true,
        });
    },

    // Error notification
    error: (message: string) => {
        showBrowserNotification('⚠️ Erreur', {
            body: message,
            playSound: true,
        });
    },
};
