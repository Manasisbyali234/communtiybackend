"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.communitiesService = void 0;
const database_1 = require("../config/database");
const ApiError_1 = require("../utils/ApiError");
const slugify_1 = require("../utils/slugify");
const pagination_1 = require("../utils/pagination");
const client_1 = require("@prisma/client");
const posts_service_1 = require("./posts.service");
const notifications_service_1 = require("./notifications.service");
const email_service_1 = require("./email.service");
exports.communitiesService = {
    async list(params) {
        const { cursor, limit = 20, category, search, sort = 'newest', userId } = params;
        const args = (0, pagination_1.buildCursorArgs)({ cursor, limit });
        const communities = await database_1.prisma.community.findMany({
            ...args,
            where: {
                status: 'APPROVED',
                ...(category ? { category: { equals: category, mode: 'insensitive' } } : {}),
                ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }] } : {}),
            },
            orderBy: sort === 'popular' ? { memberCount: 'desc' } : { createdAt: 'desc' },
            include: userId ? { members: { where: { userId }, select: { userId: true, status: true } } } : undefined,
        });
        const page = (0, pagination_1.buildCursorPage)(communities, limit);
        return {
            ...page,
            data: page.data.map((c) => {
                const { members, ...rest } = c;
                const membership = members?.[0];
                return {
                    ...rest,
                    isJoined: membership?.status === client_1.CommunityMemberStatus.ACTIVE,
                    memberStatus: membership?.status ?? null,
                };
            }),
        };
    },
    async create(creatorId, data) {
        let slug = (0, slugify_1.slugify)(data.name);
        const existing = await database_1.prisma.community.findUnique({ where: { slug } });
        if (existing)
            throw ApiError_1.ApiError.conflict('A community with this name already exists');
        const community = await database_1.prisma.community.create({
            data: {
                ...data,
                slug,
                status: 'PENDING',
                memberCount: 1,
                members: { create: { userId: creatorId, role: client_1.CommunityMemberRole.ADMIN, status: client_1.CommunityMemberStatus.ACTIVE } },
            },
        });
        // Email admin about new community pending approval (non-critical — fire-and-forget)
        database_1.prisma.user
            .findFirst({ where: { role: 'ADMIN' }, select: { email: true } })
            .then((adminUser) => {
            if (adminUser) {
                return email_service_1.emailService.sendAdminAlert(adminUser.email, `New Community Pending Approval: "${data.name}"`, `A new community <strong>"${data.name}"</strong> has been submitted and is awaiting your approval.`);
            }
        })
            .catch((err) => console.error('[communitiesService.create] Failed to send admin email:', err));
        return community;
    },
    async getMyRequests(userId) {
        const memberships = await database_1.prisma.communityMember.findMany({
            where: { userId, role: client_1.CommunityMemberRole.ADMIN },
            select: { communityId: true },
        });
        const communityIds = memberships.map((m) => m.communityId);
        return database_1.prisma.community.findMany({
            where: { id: { in: communityIds }, status: { in: ['PENDING', 'REJECTED'] } },
            orderBy: { createdAt: 'desc' },
        });
    },
    async getById(id, userId) {
        const community = await database_1.prisma.community.findUnique({ where: { id } });
        if (!community)
            throw ApiError_1.ApiError.notFound('Community not found');
        // Only allow access to non-APPROVED communities for their admin creator
        if (community.status !== 'APPROVED') {
            const membership = await database_1.prisma.communityMember.findUnique({
                where: { communityId_userId: { communityId: id, userId } },
            });
            if (!membership || membership.role !== client_1.CommunityMemberRole.ADMIN) {
                throw ApiError_1.ApiError.notFound('Community not found');
            }
        }
        const membership = await database_1.prisma.communityMember.findUnique({
            where: { communityId_userId: { communityId: id, userId } },
        });
        const rules = await database_1.prisma.communityRule.findMany({
            where: { communityId: id },
            orderBy: { order: 'asc' },
        });
        return { ...community, isJoined: !!membership && membership.status === client_1.CommunityMemberStatus.ACTIVE, memberRole: membership?.role ?? null, memberStatus: membership?.status ?? null, rules, feedPostPrompts: community.feedPostPrompts ?? [] };
    },
    async update(communityId, userId, data) {
        await this.requireRole(communityId, userId, [client_1.CommunityMemberRole.ADMIN]);
        return database_1.prisma.community.update({ where: { id: communityId }, data });
    },
    async delete(communityId, userId) {
        await this.requireRole(communityId, userId, [client_1.CommunityMemberRole.ADMIN]);
        await database_1.prisma.community.delete({ where: { id: communityId } });
    },
    async join(communityId, userId) {
        const community = await database_1.prisma.community.findUnique({ where: { id: communityId } });
        if (!community)
            throw ApiError_1.ApiError.notFound('Community not found');
        const existingMember = await database_1.prisma.communityMember.findUnique({
            where: { communityId_userId: { communityId, userId } },
        });
        if (existingMember) {
            if (existingMember.status === client_1.CommunityMemberStatus.ACTIVE)
                throw ApiError_1.ApiError.conflict('Already a member');
            if (existingMember.status === client_1.CommunityMemberStatus.PENDING)
                throw ApiError_1.ApiError.conflict('Join request already pending');
        }
        const status = community.isPrivate ? client_1.CommunityMemberStatus.PENDING : client_1.CommunityMemberStatus.ACTIVE;
        await database_1.prisma.communityMember.create({ data: { communityId, userId, status } });
        if (community.isPrivate) {
            // Notify community admins about the pending join request
            const admins = await database_1.prisma.communityMember.findMany({
                where: { communityId, role: client_1.CommunityMemberRole.ADMIN, status: client_1.CommunityMemberStatus.ACTIVE },
                select: { userId: true },
            });
            const joiner = await database_1.prisma.user.findUnique({ where: { id: userId }, select: { displayName: true } });
            for (const admin of admins) {
                if (admin.userId !== userId) {
                    await notifications_service_1.notificationsService.create({
                        recipientId: admin.userId,
                        type: 'COMMUNITY_JOIN',
                        actorId: userId,
                        entityId: communityId,
                        entityType: 'CommunityJoinRequest',
                        body: `${joiner?.displayName ?? 'Someone'} requested to join ${community.name}.`,
                    });
                }
            }
        }
        else {
            await database_1.prisma.community.update({ where: { id: communityId }, data: { memberCount: { increment: 1 } } });
            // Notify community admins
            const admins = await database_1.prisma.communityMember.findMany({
                where: { communityId, role: client_1.CommunityMemberRole.ADMIN, status: client_1.CommunityMemberStatus.ACTIVE },
                select: { userId: true },
            });
            const joiner = await database_1.prisma.user.findUnique({ where: { id: userId }, select: { displayName: true } });
            for (const admin of admins) {
                if (admin.userId !== userId) {
                    await notifications_service_1.notificationsService.create({
                        recipientId: admin.userId,
                        type: 'COMMUNITY_JOIN',
                        actorId: userId,
                        entityId: communityId,
                        entityType: 'Community',
                        body: `${joiner?.displayName ?? 'Someone'} joined ${community.name}.`,
                    });
                }
            }
        }
        return { status };
    },
    async leave(communityId, userId) {
        const member = await database_1.prisma.communityMember.findUnique({
            where: { communityId_userId: { communityId, userId } },
        });
        if (!member)
            return;
        await database_1.prisma.communityMember.delete({ where: { communityId_userId: { communityId, userId } } });
        if (member.status === client_1.CommunityMemberStatus.ACTIVE) {
            await database_1.prisma.community.update({ where: { id: communityId }, data: { memberCount: { decrement: 1 } } });
        }
    },
    async getPendingMembers(communityId, requesterId) {
        await this.requireRole(communityId, requesterId, [client_1.CommunityMemberRole.ADMIN, client_1.CommunityMemberRole.MODERATOR]);
        const members = await database_1.prisma.communityMember.findMany({
            where: { communityId, status: client_1.CommunityMemberStatus.PENDING },
            include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
            orderBy: { joinedAt: 'asc' },
        });
        return members.map((m) => ({ ...m.user, joinedAt: m.joinedAt }));
    },
    async approveMember(communityId, requesterId, targetUserId) {
        await this.requireRole(communityId, requesterId, [client_1.CommunityMemberRole.ADMIN, client_1.CommunityMemberRole.MODERATOR]);
        const member = await database_1.prisma.communityMember.findUnique({ where: { communityId_userId: { communityId, userId: targetUserId } } });
        if (!member)
            throw ApiError_1.ApiError.notFound('Pending member not found');
        if (member.status === client_1.CommunityMemberStatus.ACTIVE)
            return; // already approved — idempotent
        if (member.status !== client_1.CommunityMemberStatus.PENDING)
            throw ApiError_1.ApiError.badRequest('Member is not in pending state');
        await database_1.prisma.$transaction([
            database_1.prisma.communityMember.update({
                where: { communityId_userId: { communityId, userId: targetUserId } },
                data: { status: client_1.CommunityMemberStatus.ACTIVE },
            }),
            database_1.prisma.community.update({ where: { id: communityId }, data: { memberCount: { increment: 1 } } }),
        ]);
        const community = await database_1.prisma.community.findUnique({ where: { id: communityId }, select: { name: true } });
        await notifications_service_1.notificationsService.create({
            recipientId: targetUserId,
            type: 'COMMUNITY_APPROVED',
            actorId: requesterId,
            entityId: communityId,
            entityType: 'Community',
            body: `Your request to join ${community?.name ?? 'the community'} was approved!`,
        });
    },
    async rejectMember(communityId, requesterId, targetUserId) {
        await this.requireRole(communityId, requesterId, [client_1.CommunityMemberRole.ADMIN, client_1.CommunityMemberRole.MODERATOR]);
        const member = await database_1.prisma.communityMember.findUnique({ where: { communityId_userId: { communityId, userId: targetUserId } } });
        if (!member || member.status !== client_1.CommunityMemberStatus.PENDING)
            return; // already handled — idempotent
        await database_1.prisma.communityMember.update({
            where: { communityId_userId: { communityId, userId: targetUserId } },
            data: { status: client_1.CommunityMemberStatus.REJECTED },
        });
        const community = await database_1.prisma.community.findUnique({ where: { id: communityId }, select: { name: true } });
        await notifications_service_1.notificationsService.create({
            recipientId: targetUserId,
            type: 'COMMUNITY_REJECTED',
            actorId: requesterId,
            entityId: communityId,
            entityType: 'Community',
            body: `Your request to join ${community?.name ?? 'the community'} was declined.`,
        });
    },
    async getMembers(communityId, cursor, limit = 20) {
        const args = (0, pagination_1.buildCursorArgs)({ cursor, limit });
        const members = await database_1.prisma.communityMember.findMany({
            ...args,
            where: { communityId, status: client_1.CommunityMemberStatus.ACTIVE },
            include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
            orderBy: { joinedAt: 'asc' },
        });
        const items = members.map((m) => ({ ...m.user, role: m.role, joinedAt: m.joinedAt }));
        return (0, pagination_1.buildCursorPage)(items, limit);
    },
    async updateMemberRole(communityId, requesterId, targetUserId, role) {
        await this.requireRole(communityId, requesterId, [client_1.CommunityMemberRole.ADMIN]);
        return database_1.prisma.communityMember.update({
            where: { communityId_userId: { communityId, userId: targetUserId } },
            data: { role },
        });
    },
    async removeMember(communityId, requesterId, targetUserId) {
        await this.requireRole(communityId, requesterId, [client_1.CommunityMemberRole.ADMIN, client_1.CommunityMemberRole.MODERATOR]);
        const member = await database_1.prisma.communityMember.findUnique({ where: { communityId_userId: { communityId, userId: targetUserId } } });
        if (!member)
            throw ApiError_1.ApiError.notFound('Member not found');
        await database_1.prisma.$transaction([
            database_1.prisma.communityMember.delete({ where: { communityId_userId: { communityId, userId: targetUserId } } }),
            ...(member.status === client_1.CommunityMemberStatus.ACTIVE
                ? [database_1.prisma.community.update({ where: { id: communityId }, data: { memberCount: { decrement: 1 } } })]
                : []),
        ]);
    },
    async getCommunityPosts(communityId, userId, cursor, limit = 20) {
        const community = await database_1.prisma.community.findUnique({
            where: { id: communityId },
            select: { isPrivate: true },
        });
        if (!community)
            throw ApiError_1.ApiError.notFound('Community not found');
        if (community.isPrivate) {
            const isAdmin = await database_1.prisma.communityMember.findFirst({
                where: { communityId, userId, role: client_1.CommunityMemberRole.ADMIN, status: client_1.CommunityMemberStatus.ACTIVE },
                select: { id: true },
            });
            if (!isAdmin) {
                const followsAdmin = await database_1.prisma.communityMember.findFirst({
                    where: {
                        communityId,
                        role: client_1.CommunityMemberRole.ADMIN,
                        status: client_1.CommunityMemberStatus.ACTIVE,
                        user: { followers: { some: { followerId: userId } } },
                    },
                    select: { id: true },
                });
                if (!followsAdmin)
                    throw ApiError_1.ApiError.forbidden('This private community is only visible to the creator\'s followers');
            }
        }
        const args = (0, pagination_1.buildCursorArgs)({ cursor, limit });
        const posts = await database_1.prisma.post.findMany({
            ...args,
            where: { communityId, deletedAt: null, isDraft: false, status: 'APPROVED' },
            select: posts_service_1.POST_SELECT,
            orderBy: { createdAt: 'desc' },
        });
        return (0, pagination_1.buildCursorPage)(posts, limit);
    },
    // ── Community Rules ──────────────────────────────────────────────────────────
    async getRules(communityId) {
        return database_1.prisma.communityRule.findMany({ where: { communityId }, orderBy: { order: 'asc' } });
    },
    async addRule(communityId, requesterId, data) {
        await this.requireRole(communityId, requesterId, [client_1.CommunityMemberRole.ADMIN, client_1.CommunityMemberRole.MODERATOR]);
        const count = await database_1.prisma.communityRule.count({ where: { communityId } });
        return database_1.prisma.communityRule.create({ data: { communityId, ...data, order: count } });
    },
    async updateRule(communityId, ruleId, requesterId, data) {
        await this.requireRole(communityId, requesterId, [client_1.CommunityMemberRole.ADMIN, client_1.CommunityMemberRole.MODERATOR]);
        const rule = await database_1.prisma.communityRule.findFirst({ where: { id: ruleId, communityId } });
        if (!rule)
            throw ApiError_1.ApiError.notFound('Rule not found');
        return database_1.prisma.communityRule.update({ where: { id: ruleId }, data });
    },
    async deleteRule(communityId, ruleId, requesterId) {
        await this.requireRole(communityId, requesterId, [client_1.CommunityMemberRole.ADMIN]);
        const rule = await database_1.prisma.communityRule.findFirst({ where: { id: ruleId, communityId } });
        if (!rule)
            throw ApiError_1.ApiError.notFound('Rule not found');
        await database_1.prisma.communityRule.delete({ where: { id: ruleId } });
    },
    // ── Community Invites ────────────────────────────────────────────────────────
    async inviteMember(communityId, senderId, recipientId) {
        await this.requireRole(communityId, senderId, [client_1.CommunityMemberRole.ADMIN, client_1.CommunityMemberRole.MODERATOR]);
        const target = await database_1.prisma.user.findUnique({ where: { id: recipientId } });
        if (!target)
            throw ApiError_1.ApiError.notFound('User not found');
        const alreadyMember = await database_1.prisma.communityMember.findUnique({ where: { communityId_userId: { communityId, userId: recipientId } } });
        if (alreadyMember && alreadyMember.status === client_1.CommunityMemberStatus.ACTIVE)
            throw ApiError_1.ApiError.conflict('User is already a member');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await database_1.prisma.communityInvite.upsert({
            where: { communityId_recipientId: { communityId, recipientId } },
            create: { communityId, senderId, recipientId, expiresAt },
            update: { senderId, expiresAt, status: 'PENDING' },
        });
        const [community, sender] = await Promise.all([
            database_1.prisma.community.findUnique({ where: { id: communityId }, select: { name: true } }),
            database_1.prisma.user.findUnique({ where: { id: senderId }, select: { displayName: true } }),
        ]);
        await notifications_service_1.notificationsService.create({
            recipientId,
            type: 'COMMUNITY_INVITE',
            actorId: senderId,
            entityId: communityId,
            entityType: 'Community',
            body: `${sender?.displayName ?? 'Someone'} invited you to join ${community?.name ?? 'a community'}.`,
        });
    },
    async acceptInvite(communityId, userId) {
        const invite = await database_1.prisma.communityInvite.findUnique({
            where: { communityId_recipientId: { communityId, recipientId: userId } },
        });
        if (!invite || invite.status !== 'PENDING')
            throw ApiError_1.ApiError.notFound('Invite not found');
        if (invite.expiresAt < new Date())
            throw ApiError_1.ApiError.badRequest('Invite has expired');
        await database_1.prisma.$transaction([
            database_1.prisma.communityMember.upsert({
                where: { communityId_userId: { communityId, userId } },
                create: { communityId, userId, status: client_1.CommunityMemberStatus.ACTIVE },
                update: { status: client_1.CommunityMemberStatus.ACTIVE },
            }),
            database_1.prisma.community.update({ where: { id: communityId }, data: { memberCount: { increment: 1 } } }),
            database_1.prisma.communityInvite.update({ where: { communityId_recipientId: { communityId, recipientId: userId } }, data: { status: 'ACCEPTED' } }),
        ]);
    },
    async declineInvite(communityId, userId) {
        await database_1.prisma.communityInvite.updateMany({
            where: { communityId, recipientId: userId, status: 'PENDING' },
            data: { status: 'DECLINED' },
        });
    },
    async getMyInvites(userId) {
        return database_1.prisma.communityInvite.findMany({
            where: { recipientId: userId, status: 'PENDING', expiresAt: { gt: new Date() } },
            include: {
                community: { select: { id: true, name: true, slug: true, avatarUrl: true } },
                sender: { select: { id: true, username: true, displayName: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    },
    async requireRole(communityId, userId, roles) {
        const member = await database_1.prisma.communityMember.findUnique({ where: { communityId_userId: { communityId, userId } } });
        if (!member || member.status !== client_1.CommunityMemberStatus.ACTIVE || !roles.includes(member.role)) {
            throw ApiError_1.ApiError.forbidden('Insufficient community role');
        }
    },
};
//# sourceMappingURL=communities.service.js.map