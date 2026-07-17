"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsService = void 0;
const database_1 = require("../config/database");
exports.settingsService = {
    async getSettings(userId) {
        const settings = await database_1.prisma.userSetting.findUnique({ where: { userId } });
        if (!settings) {
            // Create default settings if none exist
            return database_1.prisma.userSetting.create({ data: { userId } });
        }
        return settings;
    },
    async updateSettings(userId, data) {
        return database_1.prisma.userSetting.upsert({
            where: { userId },
            create: { userId, ...data },
            update: data,
        });
    },
};
//# sourceMappingURL=settings.service.js.map