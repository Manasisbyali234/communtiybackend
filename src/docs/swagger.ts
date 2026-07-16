import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import { config } from '../config/index';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Community App API',
      version: '1.0.0',
      description: 'Enterprise-grade community platform REST API',
      contact: { name: 'API Support', email: 'support@community.app' },
    },
    servers: [
      { url: `${config.APP_URL}/api/v1`, description: 'Current environment' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            statusCode: { type: 'integer', example: 200 },
            message: { type: 'string', example: 'Success' },
            data: { type: 'object' },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            statusCode: { type: 'integer', example: 400 },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cuid123' },
            email: { type: 'string', format: 'email' },
            username: { type: 'string' },
            displayName: { type: 'string' },
            bio: { type: 'string', nullable: true },
            avatarUrl: { type: 'string', nullable: true },
            bannerUrl: { type: 'string', nullable: true },
            role: { type: 'string', enum: ['USER', 'MODERATOR', 'ADMIN'] },
            isVerified: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Post: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            content: { type: 'string' },
            mediaUrls: { type: 'array', items: { type: 'string' } },
            likesCount: { type: 'integer' },
            commentsCount: { type: 'integer' },
            isDraft: { type: 'boolean' },
            scheduledAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            author: { $ref: '#/components/schemas/User' },
          },
        },
        Community: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string', nullable: true },
            category: { type: 'string' },
            isPrivate: { type: 'boolean' },
            memberCount: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string' },
            actorId: { type: 'string', nullable: true },
            entityId: { type: 'string', nullable: true },
            body: { type: 'string', nullable: true },
            isRead: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CursorPage: {
          type: 'object',
          properties: {
            items: { type: 'array', items: { type: 'object' } },
            nextCursor: { type: 'string', nullable: true },
            hasMore: { type: 'boolean' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Authentication', description: 'Register, login, OAuth, OTP, tokens' },
      { name: 'Users', description: 'Profiles, follows, blocks, settings, bookmarks' },
      { name: 'Posts', description: 'CRUD, likes, comments, hashtags, drafts' },
      { name: 'Communities', description: 'CRUD, members, rules, invites' },
      { name: 'Stories', description: 'Create, view, like, reply' },
      { name: 'Messages', description: 'Conversations, messages, reactions' },
      { name: 'Events', description: 'CRUD, RSVP' },
      { name: 'Notifications', description: 'List, mark read, delete' },
      { name: 'Explore', description: 'Trending, suggested content, hashtags' },
      { name: 'Search', description: 'Global and type-specific search' },
      { name: 'Media', description: 'Pre-signed upload URLs' },
      { name: 'Admin', description: 'Dashboard, analytics, moderation (admin only)' },
      { name: 'Health', description: 'Health checks and liveness/readiness probes' },
    ],
  },
  apis: ['./src/routes/v1/*.ts'],
};

const spec = swaggerJsdoc(options);

export function setupSwagger(app: Application): void {
  if (!config.SWAGGER_ENABLED) return;

  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Community App API Docs',
      swaggerOptions: { persistAuthorization: true },
    }),
  );

  // Raw JSON spec
  app.get('/api/docs.json', (_req, res) => res.json(spec));
}
