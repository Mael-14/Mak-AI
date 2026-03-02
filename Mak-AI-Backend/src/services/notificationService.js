/**
 * notificationService.js  (Backend)
 *
 * Sends push notifications via the Expo Push API using expo-server-sdk.
 * Handles DeviceNotRegistered errors by marking tokens as inactive.
 *
 * Install: npm install expo-server-sdk
 */

const { Expo } = require('expo-server-sdk');
// Use the already-initialized Firebase Admin instance from config
const { db, admin } = require('../config/firebase');

// Create a single Expo SDK client instance (reused across calls)
const expo = new Expo();

// ─── Send to a single user ────────────────────────────────────────────────────

/**
 * Sends a push notification to all active tokens of a given user.
 *
 * @param {string} userId           - Firebase UID of the target user
 * @param {string} title            - Notification title
 * @param {string} body             - Notification body message
 * @param {object} [data={}]        - Custom JSON payload (e.g. { screen: '/(tabs)' })
 * @param {object} [options={}]     - Extra Expo message fields (sound, badge, etc.)
 */
async function sendPushNotificationToUser(userId, title, body, data = {}, options = {}) {
    try {
        // 1. Fetch all active push tokens for this user
        const tokensSnapshot = await db
            .collection('users')
            .doc(userId)
            .collection('pushTokens')
            .where('active', '==', true)
            .get();

        if (tokensSnapshot.empty) {
            console.log(`[Notifications] No active tokens for user ${userId}`);
            return { sent: 0 };
        }

        // 2. Build message objects
        const messages = [];
        const tokenDocs = [];

        tokensSnapshot.forEach((doc) => {
            const { token } = doc.data();

            // Validate token format before sending
            if (!Expo.isExpoPushToken(token)) {
                console.warn(`[Notifications] Invalid token for user ${userId}: ${token}`);
                return;
            }

            messages.push({
                to: token,
                title,
                body,
                data,
                sound: 'default',
                ...options,
            });

            tokenDocs.push({ docRef: doc.ref, token });
        });

        if (messages.length === 0) {
            return { sent: 0 };
        }

        // 3. Send in batches (Expo accepts up to 100 messages per request)
        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];

        for (const chunk of chunks) {
            const chunkTickets = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...chunkTickets);
        }

        // 4. Handle DeviceNotRegistered errors — deactivate dead tokens
        await handleTicketErrors(tickets, tokenDocs);

        console.log(`[Notifications] Sent ${tickets.length} notification(s) to user ${userId}`);
        return { sent: tickets.length, tickets };
    } catch (error) {
        console.error('[Notifications] sendPushNotificationToUser error:', error);
        throw error;
    }
}

// ─── Ticket error handler ─────────────────────────────────────────────────────

/**
 * Iterates push tickets and marks DeviceNotRegistered tokens as inactive.
 */
async function handleTicketErrors(tickets, tokenDocs) {
    const batch = db.batch();
    let hasUpdates = false;

    tickets.forEach((ticket, index) => {
        if (ticket.status === 'error') {
            console.warn('[Notifications] Ticket error:', ticket.message);

            if (ticket.details?.error === 'DeviceNotRegistered') {
                // The token is no longer valid — mark as inactive so we stop sending to it
                const tokenDoc = tokenDocs[index];
                if (tokenDoc) {
                    batch.update(tokenDoc.docRef, { active: false });
                    hasUpdates = true;
                    console.log(`[Notifications] Marked token inactive: ${tokenDoc.token}`);
                }
            }
        }
    });

    if (hasUpdates) {
        await batch.commit();
    }
}

// ─── Save / remove token helpers (used by the route) ─────────────────────────

/**
 * Saves or updates a push token for a user in Firestore.
 *
 * Path: users/{userId}/pushTokens/{sanitizedToken}
 */
async function savePushToken(userId, token, platform = 'unknown') {
    // Use a safe Firestore document ID derived from the token
    const tokenId = token.replace(/[^a-zA-Z0-9]/g, '_');

    await db
        .collection('users')
        .doc(userId)
        .collection('pushTokens')
        .doc(tokenId)
        .set(
            {
                token,
                platform,
                active: true,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true } // Creates if doesn't exist, updates if it does
        );

    console.log(`[Notifications] Token saved for user ${userId}: ${token}`);
}

/**
 * Marks a push token as inactive (e.g. on logout).
 */
async function deactivatePushToken(userId, token) {
    const tokenId = token.replace(/[^a-zA-Z0-9]/g, '_');

    await db
        .collection('users')
        .doc(userId)
        .collection('pushTokens')
        .doc(tokenId)
        .update({ active: false });

    console.log(`[Notifications] Token deactivated for user ${userId}`);
}

module.exports = {
    sendPushNotificationToUser,
    savePushToken,
    deactivatePushToken,
};
