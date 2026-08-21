"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCommunityStory = exports.updateCommunityStory = exports.createCommunityStory = exports.listCommunityStoriesAdmin = exports.getCommunityStory = exports.listCommunityStories = exports.deleteHelp = exports.resolveHelp = exports.moderateHelp = exports.listHelpAdmin = exports.offerHelp = exports.createHelp = exports.getHelp = exports.myHelp = exports.listHelp = exports.businessModeration = exports.listBusinessesAdmin = exports.addBusinessReview = exports.contactBusiness = exports.deleteBusiness = exports.updateBusiness = exports.createBusiness = exports.myBusinesses = exports.getBusiness = exports.listBusinesses = void 0;
const database_1 = require("../config/database");
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
const notifications_service_1 = require("../services/notifications.service");
const adminOnly = (req) => {
    if (req.user.role !== 'ADMIN')
        throw new ApiError_1.ApiError(403, 'Administrator access required');
};
const businessInclude = { user: { select: { id: true, displayName: true, avatarUrl: true } }, reviews: true };
const helpInclude = { user: { select: { id: true, displayName: true, avatarUrl: true, phone: true } }, helpers: { include: { user: { select: { id: true, displayName: true, avatarUrl: true, phone: true } } } } };
const mapBusiness = (b) => ({ ...b, ownerName: b.user.displayName, ownerAvatarUrl: b.user.avatarUrl, submittedAt: b.createdAt, reviewCount: b.reviews.length, averageRating: b.reviews.length ? b.reviews.reduce((sum, r) => sum + r.rating, 0) / b.reviews.length : 0 });
const mapHelp = (r) => ({ ...r, requesterName: r.user.displayName, requesterAvatarUrl: r.user.avatarUrl, requesterPhone: r.user.phone, requesterLocation: r.location, helpers: r.helpers.map((h) => ({ id: h.id, requestId: h.requestId, helperId: h.userId, helperName: h.user.displayName, helperAvatarUrl: h.user.avatarUrl, helperPhone: h.user.phone, message: h.message, offeredAt: h.createdAt })), reports: [] });
exports.listBusinesses = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { category, search } = req.query;
    const businesses = await database_1.prisma.businessListing.findMany({ where: { status: 'APPROVED', ...(category ? { category } : {}), ...(search ? { OR: ['businessName', 'description', 'productsServices', 'location'].map((field) => ({ [field]: { contains: search, mode: 'insensitive' } })) } : {}) }, include: businessInclude, orderBy: { approvedAt: 'desc' } });
    res.json(new ApiResponse_1.ApiResponse(200, businesses.map(mapBusiness)));
});
exports.getBusiness = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const business = await database_1.prisma.businessListing.findUnique({ where: { id: req.params.id }, include: businessInclude });
    if (!business || (business.status !== 'APPROVED' && business.userId !== req.user.id && req.user.role !== 'ADMIN'))
        throw new ApiError_1.ApiError(404, 'Business not found');
    res.json(new ApiResponse_1.ApiResponse(200, mapBusiness(business)));
});
exports.myBusinesses = (0, asyncHandler_1.asyncHandler)(async (req, res) => { const rows = await database_1.prisma.businessListing.findMany({ where: { userId: req.user.id }, include: businessInclude, orderBy: { createdAt: 'desc' } }); res.json(new ApiResponse_1.ApiResponse(200, rows.map(mapBusiness))); });
exports.createBusiness = (0, asyncHandler_1.asyncHandler)(async (req, res) => { const row = await database_1.prisma.businessListing.create({ data: { ...req.body, userId: req.user.id, status: 'PENDING', photos: req.body.photos ?? [] }, include: businessInclude }); res.status(201).json(new ApiResponse_1.ApiResponse(201, mapBusiness(row))); });
exports.updateBusiness = (0, asyncHandler_1.asyncHandler)(async (req, res) => { const current = await database_1.prisma.businessListing.findUnique({ where: { id: req.params.id } }); if (!current || (current.userId !== req.user.id && req.user.role !== 'ADMIN'))
    throw new ApiError_1.ApiError(404, 'Business not found'); const row = await database_1.prisma.businessListing.update({ where: { id: current.id }, data: { ...req.body, status: req.user.role === 'ADMIN' ? current.status : 'PENDING', rejectionReason: null }, include: businessInclude }); res.json(new ApiResponse_1.ApiResponse(200, mapBusiness(row))); });
exports.deleteBusiness = (0, asyncHandler_1.asyncHandler)(async (req, res) => { const current = await database_1.prisma.businessListing.findUnique({ where: { id: req.params.id } }); if (!current || (current.userId !== req.user.id && req.user.role !== 'ADMIN'))
    throw new ApiError_1.ApiError(404, 'Business not found'); await database_1.prisma.businessListing.delete({ where: { id: current.id } }); res.json(new ApiResponse_1.ApiResponse(200, null)); });
exports.contactBusiness = (0, asyncHandler_1.asyncHandler)(async (req, res) => { const b = await database_1.prisma.businessListing.findUnique({ where: { id: req.params.id } }); if (!b || b.status !== 'APPROVED')
    throw new ApiError_1.ApiError(404, 'Business not found'); await notifications_service_1.notificationsService.create({ recipientId: b.userId, actorId: req.user.id, entityId: b.id, entityType: 'BUSINESS', type: 'MESSAGE', body: 'sent a contact request for your business.' }); res.json(new ApiResponse_1.ApiResponse(200, null, 'Business owner notified')); });
exports.addBusinessReview = (0, asyncHandler_1.asyncHandler)(async (req, res) => { const business = await database_1.prisma.businessListing.findUnique({ where: { id: req.params.id } }); if (!business || business.status !== 'APPROVED')
    throw new ApiError_1.ApiError(404, 'Business not found'); const rating = Number(req.body.rating); if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !String(req.body.comment ?? '').trim())
    throw new ApiError_1.ApiError(400, 'A rating from 1 to 5 and a review comment are required'); const review = await database_1.prisma.businessReview.upsert({ where: { businessId_userId: { businessId: business.id, userId: req.user.id } }, create: { businessId: business.id, userId: req.user.id, reviewerName: req.user.email, rating, comment: String(req.body.comment).trim() }, update: { rating, comment: String(req.body.comment).trim() } }); res.status(201).json(new ApiResponse_1.ApiResponse(201, review)); });
exports.listBusinessesAdmin = (0, asyncHandler_1.asyncHandler)(async (req, res) => { adminOnly(req); const rows = await database_1.prisma.businessListing.findMany({ where: req.query.status ? { status: String(req.query.status) } : {}, include: businessInclude, orderBy: { createdAt: 'desc' } }); res.json(new ApiResponse_1.ApiResponse(200, rows.map(mapBusiness))); });
exports.businessModeration = (0, asyncHandler_1.asyncHandler)(async (req, res) => { adminOnly(req); const status = req.body.status === 'APPROVED' ? 'APPROVED' : 'REJECTED'; const row = await database_1.prisma.businessListing.update({ where: { id: req.params.id }, data: { status, isVerified: status === 'APPROVED', approvedAt: status === 'APPROVED' ? new Date() : null, rejectedAt: status === 'REJECTED' ? new Date() : null, rejectionReason: status === 'REJECTED' ? req.body.reason ?? null : null } }); await notifications_service_1.notificationsService.create({ recipientId: row.userId, entityId: row.id, entityType: 'BUSINESS', type: 'MESSAGE', body: `Your business listing was ${status.toLowerCase()}.` }); res.json(new ApiResponse_1.ApiResponse(200, row)); });
exports.listHelp = (0, asyncHandler_1.asyncHandler)(async (req, res) => { const { category, urgency, search } = req.query; const rows = await database_1.prisma.communityHelpRequest.findMany({ where: { status: 'APPROVED', ...(category ? { category } : {}), ...(urgency ? { urgency } : {}), ...(search ? { OR: ['title', 'description', 'location'].map((field) => ({ [field]: { contains: search, mode: 'insensitive' } })) } : {}) }, include: helpInclude, orderBy: { createdAt: 'desc' } }); res.json(new ApiResponse_1.ApiResponse(200, rows.map(mapHelp))); });
exports.myHelp = (0, asyncHandler_1.asyncHandler)(async (req, res) => { const rows = await database_1.prisma.communityHelpRequest.findMany({ where: { userId: req.user.id }, include: helpInclude, orderBy: { createdAt: 'desc' } }); res.json(new ApiResponse_1.ApiResponse(200, rows.map(mapHelp))); });
exports.getHelp = (0, asyncHandler_1.asyncHandler)(async (req, res) => { const row = await database_1.prisma.communityHelpRequest.findUnique({ where: { id: req.params.id }, include: helpInclude }); if (!row || (row.status !== 'APPROVED' && row.userId !== req.user.id && req.user.role !== 'ADMIN'))
    throw new ApiError_1.ApiError(404, 'Help request not found'); res.json(new ApiResponse_1.ApiResponse(200, mapHelp(row))); });
exports.createHelp = (0, asyncHandler_1.asyncHandler)(async (req, res) => { const status = req.body.urgency === 'URGENT' ? 'APPROVED' : 'PENDING'; const row = await database_1.prisma.communityHelpRequest.create({ data: { category: req.body.category, title: req.body.title, description: req.body.description, location: req.body.location, urgency: req.body.urgency, contactPreference: req.body.contactPreference, status, userId: req.user.id }, include: helpInclude }); res.status(201).json(new ApiResponse_1.ApiResponse(201, mapHelp(row))); });
exports.offerHelp = (0, asyncHandler_1.asyncHandler)(async (req, res) => { const request = await database_1.prisma.communityHelpRequest.findUnique({ where: { id: req.params.id } }); if (!request || request.status !== 'APPROVED')
    throw new ApiError_1.ApiError(404, 'Help request not found'); const offer = await database_1.prisma.communityHelpOffer.upsert({ where: { requestId_userId: { requestId: request.id, userId: req.user.id } }, create: { requestId: request.id, userId: req.user.id, message: req.body.message }, update: { message: req.body.message } }); await notifications_service_1.notificationsService.create({ recipientId: request.userId, actorId: req.user.id, entityId: request.id, entityType: 'COMMUNITY_HELP', type: 'MESSAGE', body: 'offered help for your request.' }); res.json(new ApiResponse_1.ApiResponse(200, offer)); });
exports.listHelpAdmin = (0, asyncHandler_1.asyncHandler)(async (req, res) => { adminOnly(req); const rows = await database_1.prisma.communityHelpRequest.findMany({ where: req.query.status ? { status: String(req.query.status) } : {}, include: helpInclude, orderBy: { createdAt: 'desc' } }); res.json(new ApiResponse_1.ApiResponse(200, rows.map(mapHelp))); });
exports.moderateHelp = (0, asyncHandler_1.asyncHandler)(async (req, res) => { adminOnly(req); const status = req.body.status === 'APPROVED' ? 'APPROVED' : 'REJECTED'; const row = await database_1.prisma.communityHelpRequest.update({ where: { id: req.params.id }, data: { status, rejectionReason: status === 'REJECTED' ? req.body.reason ?? null : null } }); res.json(new ApiResponse_1.ApiResponse(200, row)); });
exports.resolveHelp = (0, asyncHandler_1.asyncHandler)(async (req, res) => { const row = await database_1.prisma.communityHelpRequest.findUnique({ where: { id: req.params.id } }); if (!row || row.userId !== req.user.id)
    throw new ApiError_1.ApiError(404, 'Help request not found'); const updated = await database_1.prisma.communityHelpRequest.update({ where: { id: row.id }, data: { status: 'RESOLVED', resolvedAt: new Date() } }); res.json(new ApiResponse_1.ApiResponse(200, updated)); });
exports.deleteHelp = (0, asyncHandler_1.asyncHandler)(async (req, res) => { const row = await database_1.prisma.communityHelpRequest.findUnique({ where: { id: req.params.id } }); if (!row || (row.userId !== req.user.id && req.user.role !== 'ADMIN'))
    throw new ApiError_1.ApiError(404, 'Help request not found'); await database_1.prisma.communityHelpRequest.delete({ where: { id: row.id } }); res.json(new ApiResponse_1.ApiResponse(200, null)); });
exports.listCommunityStories = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { category, featuredOnly, search } = req.query;
    const rows = await database_1.prisma.communityProfileStory.findMany({
        where: {
            status: 'PUBLISHED',
            ...(category ? { category } : {}),
            ...(featuredOnly === 'true' ? { isFeatured: true } : {}),
            ...(search ? { OR: ['title', 'personName', 'profession', 'location', 'shortDescription'].map((field) => ({ [field]: { contains: search, mode: 'insensitive' } })) } : {}),
        },
        orderBy: { publishedAt: 'desc' },
    });
    res.json(new ApiResponse_1.ApiResponse(200, rows.map((story) => ({
        ...story,
        readTimeMinutes: Math.max(1, Math.round(story.fullStory.trim().split(/\s+/).length / 200)),
    }))));
});
exports.getCommunityStory = (0, asyncHandler_1.asyncHandler)(async (req, res) => { const row = await database_1.prisma.communityProfileStory.findUnique({ where: { id: req.params.id } }); if (!row || row.status !== 'PUBLISHED')
    throw new ApiError_1.ApiError(404, 'Story not found'); res.json(new ApiResponse_1.ApiResponse(200, row)); });
exports.listCommunityStoriesAdmin = (0, asyncHandler_1.asyncHandler)(async (req, res) => { adminOnly(req); const rows = await database_1.prisma.communityProfileStory.findMany({ where: req.query.status ? { status: String(req.query.status) } : {}, orderBy: { createdAt: 'desc' } }); res.json(new ApiResponse_1.ApiResponse(200, rows)); });
exports.createCommunityStory = (0, asyncHandler_1.asyncHandler)(async (req, res) => { adminOnly(req); const status = req.body.status ?? 'PUBLISHED'; const row = await database_1.prisma.communityProfileStory.create({ data: { ...req.body, authorId: req.user.id, status, publishedAt: status === 'PUBLISHED' ? new Date() : null, additionalImages: req.body.additionalImages ?? [] } }); res.status(201).json(new ApiResponse_1.ApiResponse(201, row)); });
exports.updateCommunityStory = (0, asyncHandler_1.asyncHandler)(async (req, res) => { adminOnly(req); const status = req.body.status; const row = await database_1.prisma.communityProfileStory.update({ where: { id: req.params.id }, data: { ...req.body, ...(status === 'PUBLISHED' ? { publishedAt: new Date() } : {}) } }); res.json(new ApiResponse_1.ApiResponse(200, row)); });
exports.deleteCommunityStory = (0, asyncHandler_1.asyncHandler)(async (req, res) => { adminOnly(req); await database_1.prisma.communityProfileStory.delete({ where: { id: req.params.id } }); res.json(new ApiResponse_1.ApiResponse(200, null)); });
//# sourceMappingURL=directory.controller.js.map