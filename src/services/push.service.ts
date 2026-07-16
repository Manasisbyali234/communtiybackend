import Expo, { ExpoPushMessage } from 'expo-server-sdk';
import { config } from '../config/index';
import { logger } from '../config/logger';

const expo = new Expo(config.EXPO_ACCESS_TOKEN ? { accessToken: config.EXPO_ACCESS_TOKEN } : {});

export const pushService = {
  async send(expoPushToken: string, title: string, body: string, data?: Record<string, unknown>): Promise<void> {
    if (!Expo.isExpoPushToken(expoPushToken)) {
      logger.warn({ expoPushToken }, 'Invalid Expo push token, skipping');
      return;
    }

    const message: ExpoPushMessage = {
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
            logger.error({ ticket }, 'Push notification error');
          }
        }
      }
    } catch (err) {
      logger.error({ err }, 'Failed to send push notification');
    }
  },

  async sendBatch(tokens: string[], title: string, body: string, data?: Record<string, unknown>): Promise<void> {
    const validTokens = tokens.filter(Expo.isExpoPushToken);
    if (validTokens.length === 0) return;

    const messages: ExpoPushMessage[] = validTokens.map((to) => ({ to, sound: 'default', title, body, data: data ?? {} }));
    const chunks = expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (err) {
        logger.error({ err }, 'Failed to send batch push notifications');
      }
    }
  },
};
