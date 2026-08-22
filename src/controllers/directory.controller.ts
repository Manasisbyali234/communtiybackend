import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { notificationsService } from '../services/notifications.service';

const adminOnly = (req: Request) => {
  if (req.user.role !== 'ADMIN') throw new ApiError(403, 'Administrator access required');
};
const businessInclude = { user: { select: { id: true, displayName: true, avatarUrl: true } }, reviews: true } as const;
const helpInclude = { user: { select: { id: true, displayName: true, avatarUrl: true, phone: true } }, helpers: { include: { user: { select: { id: true, displayName: true, avatarUrl: true, phone: true } } } } } as const;
const mapBusiness = (b: any) => ({ ...b, ownerName: b.user.displayName, ownerAvatarUrl: b.user.avatarUrl, submittedAt: b.createdAt, reviewCount: b.reviews.length, averageRating: b.reviews.length ? b.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / b.reviews.length : 0 });
const businessFields = (body: Record<string, unknown>) => ({
  businessName: String(body.businessName ?? '').trim(),
  category: String(body.category ?? '').trim(),
  description: String(body.description ?? '').trim(),
  productsServices: String(body.productsServices ?? '').trim(),
  location: String(body.location ?? '').trim(),
  address: body.address ? String(body.address).trim() : null,
  website: body.website ? String(body.website).trim() : null,
  whatsapp: body.whatsapp ? String(body.whatsapp).trim() : null,
  phone: body.phone ? String(body.phone).trim() : null,
  email: body.email ? String(body.email).trim() : null,
  offers: body.offers ? String(body.offers).trim() : null,
  photos: Array.isArray(body.photos) ? body.photos.filter((photo): photo is string => typeof photo === 'string') : [],
});
const mapHelp = (r: any) => ({ ...r, requesterName: r.user.displayName, requesterAvatarUrl: r.user.avatarUrl, requesterPhone: r.user.phone, requesterLocation: r.location, helpers: r.helpers.map((h: any) => ({ id: h.id, requestId: h.requestId, helperId: h.userId, helperName: h.user.displayName, helperAvatarUrl: h.user.avatarUrl, helperPhone: h.user.phone, message: h.message, offeredAt: h.createdAt })), reports: [] });

export const listBusinesses = asyncHandler(async (req: Request, res: Response) => {
  const { category, search } = req.query as Record<string, string>;
  const businesses = await prisma.businessListing.findMany({ where: { status: 'APPROVED', ...(category ? { category } : {}), ...(search ? { OR: ['businessName', 'description', 'productsServices', 'location'].map((field) => ({ [field]: { contains: search, mode: 'insensitive' } })) } : {}) }, include: businessInclude, orderBy: { approvedAt: 'desc' } });
  res.json(new ApiResponse(200, businesses.map(mapBusiness)));
});
export const getBusiness = asyncHandler(async (req: Request, res: Response) => {
  const business = await prisma.businessListing.findUnique({ where: { id: req.params.id }, include: businessInclude });
  if (!business || (business.status !== 'APPROVED' && business.userId !== req.user.id && req.user.role !== 'ADMIN')) throw new ApiError(404, 'Business not found');
  res.json(new ApiResponse(200, mapBusiness(business)));
});
export const myBusinesses = asyncHandler(async (req: Request, res: Response) => { const rows = await prisma.businessListing.findMany({ where: { userId: req.user.id }, include: businessInclude, orderBy: { createdAt: 'desc' } }); res.json(new ApiResponse(200, rows.map(mapBusiness))); });
export const createBusiness = asyncHandler(async (req: Request, res: Response) => { const row = await prisma.businessListing.create({ data: { ...businessFields(req.body), userId: req.user.id, status: 'PENDING' }, include: businessInclude }); res.status(201).json(new ApiResponse(201, mapBusiness(row))); });
export const updateBusiness = asyncHandler(async (req: Request, res: Response) => { const current = await prisma.businessListing.findUnique({ where: { id: req.params.id } }); if (!current || (current.userId !== req.user.id && req.user.role !== 'ADMIN')) throw new ApiError(404, 'Business not found'); const row = await prisma.businessListing.update({ where: { id: current.id }, data: { ...businessFields(req.body), status: req.user.role === 'ADMIN' ? current.status : 'PENDING', rejectionReason: null }, include: businessInclude }); res.json(new ApiResponse(200, mapBusiness(row))); });
export const deleteBusiness = asyncHandler(async (req: Request, res: Response) => { const current = await prisma.businessListing.findUnique({ where: { id: req.params.id } }); if (!current || (current.userId !== req.user.id && req.user.role !== 'ADMIN')) throw new ApiError(404, 'Business not found'); await prisma.businessListing.delete({ where: { id: current.id } }); res.json(new ApiResponse(200, null)); });
export const contactBusiness = asyncHandler(async (req: Request, res: Response) => { const b = await prisma.businessListing.findUnique({ where: { id: req.params.id } }); if (!b || b.status !== 'APPROVED') throw new ApiError(404, 'Business not found'); await notificationsService.create({ recipientId: b.userId, actorId: req.user.id, entityId: b.id, entityType: 'BUSINESS', type: 'MESSAGE', body: 'sent a contact request for your business.' }); res.json(new ApiResponse(200, null, 'Business owner notified')); });
export const addBusinessReview = asyncHandler(async (req: Request, res: Response) => { const business = await prisma.businessListing.findUnique({ where: { id: req.params.id } }); if (!business || business.status !== 'APPROVED') throw new ApiError(404, 'Business not found'); const rating = Number(req.body.rating); if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !String(req.body.comment ?? '').trim()) throw new ApiError(400, 'A rating from 1 to 5 and a review comment are required'); const review = await prisma.businessReview.upsert({ where: { businessId_userId: { businessId: business.id, userId: req.user.id } }, create: { businessId: business.id, userId: req.user.id, reviewerName: req.user.email, rating, comment: String(req.body.comment).trim() }, update: { rating, comment: String(req.body.comment).trim() } }); res.status(201).json(new ApiResponse(201, review)); });
export const listBusinessesAdmin = asyncHandler(async (req: Request, res: Response) => { adminOnly(req); const rows = await prisma.businessListing.findMany({ where: req.query.status ? { status: String(req.query.status) } : {}, include: businessInclude, orderBy: { createdAt: 'desc' } }); res.json(new ApiResponse(200, rows.map(mapBusiness))); });
export const businessModeration = asyncHandler(async (req: Request, res: Response) => { adminOnly(req); const status = req.body.status === 'APPROVED' ? 'APPROVED' : 'REJECTED'; const row = await prisma.businessListing.update({ where: { id: req.params.id }, data: { status, isVerified: status === 'APPROVED', approvedAt: status === 'APPROVED' ? new Date() : null, rejectedAt: status === 'REJECTED' ? new Date() : null, rejectionReason: status === 'REJECTED' ? req.body.reason ?? null : null } }); await notificationsService.create({ recipientId: row.userId, entityId: row.id, entityType: 'BUSINESS', type: 'MESSAGE', body: `Your business listing was ${status.toLowerCase()}.` }); res.json(new ApiResponse(200, row)); });

export const listHelp = asyncHandler(async (req: Request, res: Response) => { const { category, urgency, search } = req.query as Record<string, string>; const rows = await prisma.communityHelpRequest.findMany({ where: { status: 'APPROVED', ...(category ? { category } : {}), ...(urgency ? { urgency } : {}), ...(search ? { OR: ['title', 'description', 'location'].map((field) => ({ [field]: { contains: search, mode: 'insensitive' } })) } : {}) }, include: helpInclude, orderBy: { createdAt: 'desc' } }); res.json(new ApiResponse(200, rows.map(mapHelp))); });
export const myHelp = asyncHandler(async (req: Request, res: Response) => { const rows = await prisma.communityHelpRequest.findMany({ where: { userId: req.user.id }, include: helpInclude, orderBy: { createdAt: 'desc' } }); res.json(new ApiResponse(200, rows.map(mapHelp))); });
export const getHelp = asyncHandler(async (req: Request, res: Response) => { const row = await prisma.communityHelpRequest.findUnique({ where: { id: req.params.id }, include: helpInclude }); if (!row || (row.status !== 'APPROVED' && row.userId !== req.user.id && req.user.role !== 'ADMIN')) throw new ApiError(404, 'Help request not found'); res.json(new ApiResponse(200, mapHelp(row))); });
export const createHelp = asyncHandler(async (req: Request, res: Response) => { const status = req.body.urgency === 'URGENT' ? 'APPROVED' : 'PENDING'; const row = await prisma.communityHelpRequest.create({ data: { category: req.body.category, title: req.body.title, description: req.body.description, location: req.body.location, urgency: req.body.urgency, contactPreference: req.body.contactPreference, status, userId: req.user.id }, include: helpInclude }); res.status(201).json(new ApiResponse(201, mapHelp(row))); });
export const offerHelp = asyncHandler(async (req: Request, res: Response) => { const request = await prisma.communityHelpRequest.findUnique({ where: { id: req.params.id } }); if (!request || request.status !== 'APPROVED') throw new ApiError(404, 'Help request not found'); const offer = await prisma.communityHelpOffer.upsert({ where: { requestId_userId: { requestId: request.id, userId: req.user.id } }, create: { requestId: request.id, userId: req.user.id, message: req.body.message }, update: { message: req.body.message } }); await notificationsService.create({ recipientId: request.userId, actorId: req.user.id, entityId: request.id, entityType: 'COMMUNITY_HELP', type: 'MESSAGE', body: 'offered help for your request.' }); res.json(new ApiResponse(200, offer)); });
export const listHelpAdmin = asyncHandler(async (req: Request, res: Response) => { adminOnly(req); const rows = await prisma.communityHelpRequest.findMany({ where: req.query.status ? { status: String(req.query.status) } : {}, include: helpInclude, orderBy: { createdAt: 'desc' } }); res.json(new ApiResponse(200, rows.map(mapHelp))); });
export const moderateHelp = asyncHandler(async (req: Request, res: Response) => { adminOnly(req); const status = req.body.status === 'APPROVED' ? 'APPROVED' : 'REJECTED'; const row = await prisma.communityHelpRequest.update({ where: { id: req.params.id }, data: { status, rejectionReason: status === 'REJECTED' ? req.body.reason ?? null : null } }); res.json(new ApiResponse(200, row)); });
export const resolveHelp = asyncHandler(async (req: Request, res: Response) => { const row = await prisma.communityHelpRequest.findUnique({ where: { id: req.params.id } }); if (!row || row.userId !== req.user.id) throw new ApiError(404, 'Help request not found'); const updated = await prisma.communityHelpRequest.update({ where: { id: row.id }, data: { status: 'RESOLVED', resolvedAt: new Date() } }); res.json(new ApiResponse(200, updated)); });
export const deleteHelp = asyncHandler(async (req: Request, res: Response) => { const row = await prisma.communityHelpRequest.findUnique({ where: { id: req.params.id } }); if (!row || (row.userId !== req.user.id && req.user.role !== 'ADMIN')) throw new ApiError(404, 'Help request not found'); await prisma.communityHelpRequest.delete({ where: { id: row.id } }); res.json(new ApiResponse(200, null)); });

export const listCommunityStories = asyncHandler(async (req: Request, res: Response) => {
  const { category, featuredOnly, search } = req.query as Record<string, string>;
  const rows = await prisma.communityProfileStory.findMany({
    where: {
      status: 'PUBLISHED',
      ...(category ? { category } : {}),
      ...(featuredOnly === 'true' ? { isFeatured: true } : {}),
      ...(search ? { OR: ['title', 'personName', 'profession', 'location', 'shortDescription'].map((field) => ({ [field]: { contains: search, mode: 'insensitive' } })) } : {}),
    },
    orderBy: { publishedAt: 'desc' },
  });
  res.json(new ApiResponse(200, rows.map((story) => ({
    ...story,
    readTimeMinutes: Math.max(1, Math.round(story.fullStory.trim().split(/\s+/).length / 200)),
  }))));
});
export const getCommunityStory = asyncHandler(async (req: Request, res: Response) => { const row = await prisma.communityProfileStory.findUnique({ where: { id: req.params.id } }); if (!row || row.status !== 'PUBLISHED') throw new ApiError(404, 'Story not found'); res.json(new ApiResponse(200, row)); });
export const listCommunityStoriesAdmin = asyncHandler(async (req: Request, res: Response) => { adminOnly(req); const rows = await prisma.communityProfileStory.findMany({ where: req.query.status ? { status: String(req.query.status) } : {}, orderBy: { createdAt: 'desc' } }); res.json(new ApiResponse(200, rows)); });
export const createCommunityStory = asyncHandler(async (req: Request, res: Response) => { adminOnly(req); const status = req.body.status ?? 'PUBLISHED'; const row = await prisma.communityProfileStory.create({ data: { ...req.body, authorId: req.user.id, status, publishedAt: status === 'PUBLISHED' ? new Date() : null, additionalImages: req.body.additionalImages ?? [] } }); res.status(201).json(new ApiResponse(201, row)); });
export const updateCommunityStory = asyncHandler(async (req: Request, res: Response) => { adminOnly(req); const status = req.body.status; const row = await prisma.communityProfileStory.update({ where: { id: req.params.id }, data: { ...req.body, ...(status === 'PUBLISHED' ? { publishedAt: new Date() } : {}) } }); res.json(new ApiResponse(200, row)); });
export const deleteCommunityStory = asyncHandler(async (req: Request, res: Response) => { adminOnly(req); await prisma.communityProfileStory.delete({ where: { id: req.params.id } }); res.json(new ApiResponse(200, null)); });
