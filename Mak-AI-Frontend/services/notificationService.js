/**
 * notificationService.js
 *
 * Handles all push-notification logic on the frontend:
 *  1. Requesting permission
 *  2. Getting the ExpoPushToken (works in Expo Go without needing EAS / projectId)
 *  3. Sending the token to the backend so the server can target this device
 *  4. Setting up notification event listeners (foreground display + tap-to-navigate)
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from './api';

// ─── Global notification handler ────────────────────────────────────────────
// This controls how notifications behave when the app is in the FOREGROUND.
// Change shouldShowAlert / shouldPlaySound / shouldSetBadge to taste.
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// ─── Android channel ─────────────────────────────────────────────────────────
// Required on Android 8+. Must be set before showing any notification.
if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#AAB6FF',
    });
}

// ─── Token registration ───────────────────────────────────────────────────────

/**
 * Requests notification permission and returns the ExpoPushToken string.
 * Returns null if permission is denied or we are on a simulator.
 *
 * For Expo Go: does NOT need a projectId — Expo injects its own.
 * For standalone builds: pass your EAS projectId to getExpoPushTokenAsync().
 */
export async function registerForPushNotificationsAsync() {
    // Push notifications only work on real physical devices
    if (!Device.isDevice) {
        console.warn('[Notifications] Push notifications require a physical device.');
        return null;
    }

    // Check / request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.warn('[Notifications] Permission not granted.');
        return null;
    }

    // Get the Expo push token
    // In Expo Go this works without a projectId.
    // When you later create an EAS build, add: { projectId: 'YOUR_ID' }
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    console.log('[Notifications] ExpoPushToken:', token);
    return token;
}

// ─── Send token to backend ────────────────────────────────────────────────────

/**
 * Sends the ExpoPushToken to the backend so it can be stored against the user.
 * Called right after a successful login or signup.
 *
 * @param {string} token  - The ExpoPushToken string
 */
export async function sendTokenToBackend(token) {
    if (!token) return;

    try {
        await api.post('/notifications/token', {
            token,
            platform: Platform.OS, // 'ios' | 'android'
        });
        console.log('[Notifications] Token registered with backend.');
    } catch (error) {
        // Non-fatal — the user is still logged in even if token saving fails
        console.warn('[Notifications] Failed to send token to backend:', error?.message);
    }
}

/**
 * Combines registerForPushNotificationsAsync + sendTokenToBackend.
 * Call this right after a successful login / signup.
 */
export async function registerAndSendToken() {
    const token = await registerForPushNotificationsAsync();
    if (token) {
        await sendTokenToBackend(token);
    }
    return token;
}

// ─── Notification listeners ───────────────────────────────────────────────────

/**
 * Sets up foreground + tap listeners.
 * Call this once, near the top of your root layout.
 *
 * @param {object} router  - The expo-router router instance
 * @returns {function}     - Cleanup function to remove listeners (call on unmount)
 */
export function setupNotificationListeners(router) {
    // Fired when a notification arrives while the app is OPEN
    const foregroundSubscription = Notifications.addNotificationReceivedListener(
        (notification) => {
            console.log('[Notifications] Received in foreground:', notification);
            // You can update local state / badges here if needed
        }
    );

    // Fired when the user TAPS a notification (from background or killed state)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
        (response) => {
            const data = response.notification.request.content.data;
            console.log('[Notifications] User tapped notification, data:', data);

            // Navigate based on the data payload sent by the backend
            // Add more routes here as you add more notification triggers
            if (data?.screen) {
                router.push(data.screen);
            }
        }
    );

    // Return a cleanup function
    return () => {
        foregroundSubscription.remove();
        responseSubscription.remove();
    };
}
