"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const connections_controller_1 = require("../../controllers/connections.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.auth);
router.post('/:userId/request', connections_controller_1.connectionsController.send);
router.post('/requests/:requestId/accept', connections_controller_1.connectionsController.accept);
router.post('/requests/:requestId/reject', connections_controller_1.connectionsController.reject);
router.get('/:userId/status', connections_controller_1.connectionsController.getStatus);
router.get('/me/connections', connections_controller_1.connectionsController.getConnections);
router.get('/me/connections/count', connections_controller_1.connectionsController.getCount);
router.get('/:userId/connections', connections_controller_1.connectionsController.getConnections);
router.get('/:userId/connections/count', connections_controller_1.connectionsController.getCount);
router.get('/me/pending', connections_controller_1.connectionsController.getPending);
exports.default = router;
//# sourceMappingURL=connections.routes.js.map