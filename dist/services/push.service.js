"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushService = void 0;
const expo_server_sdk_1 = __importDefault(require("expo-server-sdk"));
const index_1 = require("../config/index");
const logger_1 = require("../config/logger");
const expo = new expo_server_sdk_1.default(index_1.config.EXPO_ACCESS_TOKEN ? { accessToken: index_1.config.EXPO_ACCESS_TOKEN } : {});
exports.pushService = {
    async send(expoPushToken, title, body, data) {
        if (!expo_server_sdk_1.default.isExpoPushToken(expoPushToken)) {
            logger_1.logger.warn({ expoPushToken }, 'Invalid Expo push token, skipping');
            return;
        }
        const message = {
            to: expoPushToken,
            sound: 'default',
            title,
            body,
            data: data ?? {},
        };
        try {
            const chunks = expo.chunkPushNotifications([message]);
            for (const chunk of chunks) {
                const tickets = await expo.sendPushNotificationsAsync(chunk);
                for (const ticket of tickets) {
                    if (ticket.status === 'error') {
                        logger_1.logger.error({ ticket }, 'Push notification error');
                    }
                }
            }
        }
        catch (err) {
            logger_1.logger.error({ err }, 'Failed to send push notification');
        }
    },
    async sendBatch(tokens, title, body, data) {
        const validTokens = tokens.filter(expo_server_sdk_1.default.isExpoPushToken);
        if (validTokens.length === 0)
            return;
        const messages = validTokens.map((to) => ({ to, sound: 'default', title, body, data: data ?? {} }));
        const chunks = expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
            try {
                await expo.sendPushNotificationsAsync(chunk);
            }
            catch (err) {
                logger_1.logger.error({ err }, 'Failed to send batch push notifications');
            }
        }
    },
};
//# sourceMappingURL=push.service.js.map