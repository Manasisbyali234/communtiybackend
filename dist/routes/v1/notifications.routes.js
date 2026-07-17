"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notifications_controller_1 = require("../../controllers/notifications.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.auth);
router.get('/', notifications_controller_1.notificationsController.list);
router.get('/unread-count', notifications_controller_1.notificationsController.unreadCount);
router.put('/read-all', notifications_controller_1.notificationsController.markAllRead);
router.put('/:id/read', notifications_controller_1.notificationsController.markRead);
router.delete('/:id', notifications_controller_1.notificationsController.delete);
exports.default = router;
//# sourceMappingURL=notifications.routes.js.map