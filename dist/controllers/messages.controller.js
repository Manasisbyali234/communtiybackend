"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messagesController = void 0;
const messages_service_1 = require("../services/messages.service");
const ApiResponse_1 = require("../utils/ApiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
const sockets_1 = require("../sockets");
const database_1 = require("../config/database");
exports.messagesController = {
    getConversations: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await messages_service_1.messagesService.getConversations(req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
    getOrCreate: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { participantId } = req.body;
        const conversation = await messages_service_1.messagesService.getOrCreateConversation(req.user.id, participantId);
        res.json(new ApiResponse_1.ApiResponse(200, conversation));
    }),
    getMessages: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { cursor, limit } = req.query;
        const result = await messages_service_1.messagesService.getMessages(req.params['id'], req.user.id, cursor, limit ? parseInt(limit) : 30);
        res.json(new ApiResponse_1.ApiResponse(200, result));
    }),
    sendMessage: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { content, mediaUrl, mediaType } = req.body;
        const conversationId = req.params['id'];
        const message = await messages_service_1.messagesService.sendMessage(conversationId, req.user.id, { content, mediaUrl, mediaType });
        res.status(201).json(new ApiResponse_1.ApiResponse(201, message, 'Message sent'));
        // Emit real-time event to all participants in the conversation room
        try {
            (0, sockets_1.getIO)().to(`conv:${conversationId}`).emit('chat:message', { message });
            // Notify other participants
            const participants = await database_1.prisma.conversationParticipant.findMany({
                where: { conversationId, userId: { not: req.user.id } },
                select: { userId: true },
            });
            for (const p of participants) {
                (0, sockets_1.getIO)().to(`user:${p.userId}`).emit('notification:new', {
                    type: 'MESSAGE',
                    actorId: req.user.id,
                    entityId: conversationId,
                });
            }
        }
        catch (_) {
            // Socket not critical — message already saved
        }
    }),
    getUnreadCount: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const count = await messages_service_1.messagesService.getUnreadCount(req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, { count }));
    }),
    markRead: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await messages_service_1.messagesService.markRead(req.params['id'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Marked as read'));
    }),
    addReaction: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const { emoji } = req.body;
        const reactions = await messages_service_1.messagesService.addReaction(req.params['msgId'], req.user.id, emoji);
        res.json(new ApiResponse_1.ApiResponse(200, reactions, 'Reaction added'));
    }),
    removeReaction: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const reactions = await messages_service_1.messagesService.removeReaction(req.params['msgId'], req.user.id, req.params['emoji']);
        res.json(new ApiResponse_1.ApiResponse(200, reactions, 'Reaction removed'));
    }),
    deleteForEveryone: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await messages_service_1.messagesService.deleteForEveryone(req.params['msgId'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Message deleted for everyone'));
    }),
    deleteForMe: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        await messages_service_1.messagesService.deleteForMe(req.params['msgId'], req.user.id);
        res.json(new ApiResponse_1.ApiResponse(200, null, 'Message deleted for you'));
    }),
};
//# sourceMappingURL=messages.controller.js.map