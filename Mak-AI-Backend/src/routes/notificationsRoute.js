/**
 * notificationsRoute.js
 *
 * Routes:
 *  POST /api/notifications/token        — Save the device's push token (requires auth)
 *  DELETE /api/notifications/token      — Deactivate a token on logout (requires auth)
 *  POST /api/notifications/send         — Send a notification to a user (requires auth / internal)
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
    savePushToken,
    deactivatePushToken,
    sendPushNotificationToUser,
} = require('../services/notificationService');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/notifications/token
// Saves the device's ExpoPushToken linked to the authenticated user.
// Body: { token: "ExponentPushToken[...]", platform: "ios" | "android" }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/token', authenticateToken, async (req, res, next) => {
    try {
        const { token, platform } = req.body;
        const userId = req.user.uid;

        if (!token || typeof token !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'A valid push token is required.',
            });
        }

        await savePushToken(userId, token, platform || 'unknown');

        return res.status(200).json({
            success: true,
            message: 'Push token registered successfully.',
        });
    } catch (error) {
        next(error);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/notifications/token
// Deactivates a token (call on logout so the user stops receiving notifications).
// Body: { token: "ExponentPushToken[...]" }
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/token', authenticateToken, async (req, res, next) => {
    try {
        const { token } = req.body;
        const userId = req.user.uid;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token is required.',
            });
        }

        await deactivatePushToken(userId, token);

        return res.status(200).json({
            success: true,
            message: 'Push token deactivated.',
        });
    } catch (error) {
        next(error);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/notifications/send
// Triggers a push notification to a specific user.
// Useful for testing or server-initiated sends.
// Body: { userId, title, body, data }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/send', authenticateToken, async (req, res, next) => {
    try {
        const { userId, title, body, data = {} } = req.body;

        if (!userId || !title || !body) {
            return res.status(400).json({
                success: false,
                message: 'userId, title, and body are required.',
            });
        }

        const result = await sendPushNotificationToUser(userId, title, body, data);

        return res.status(200).json({
            success: true,
            message: `Notification sent to ${result.sent} device(s).`,
            data: result,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
