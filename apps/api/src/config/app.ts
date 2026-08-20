import { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import { PrismaClient } from '@prisma/client'
import pino from 'pino'
import pretty from 'pino-pretty'
import authPlugin from './plugins/auth'
import authRoutes from './routes/auth'
import productRoutes from './routes/products'

const logger = pino(pretty({
  colorize: true,
  translateTime: 'SYS:standard',
  ignore: 'pid,hostname',
}))

export async function buildApp() {
  const fastify = FastifyInstance({
    logger: {
      instance: logger,
    },
  })

  // Register Prisma
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

  await prisma.$connect()

  fastify.decorate('prisma', prisma)

  // Graceful shutdown
  const onClose = async () => {
    await prisma.$disconnect()
  }

  fastify.addHook('onClose', async (instance, done) => {
    await onClose()
    done()
  })

  // Register plugins
  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com'] 
      : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  })

  await fastify.register(helmet, {
    contentSecurityPolicy: false, // Disable for development
  })

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    sign: {
      expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m',
    },
  })

  await fastify.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  })

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  })

  // Swagger documentation
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Elektronik Service POS API',
        description: 'API untuk sistem manajemen toko service elektronik',
        version: '1.0.0',
      },
      servers: [
        {
          url: process.env.NODE_ENV === 'production'
            ? 'https://api.yourdomain.com'
            : 'http://localhost:3001',
          description: 'API Server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  })

  await fastify.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  })

  // Register auth plugin
  await fastify.register(authPlugin)

  // Register routes
  await fastify.register(authRoutes)
  await fastify.register(productRoutes)

  // Health check
  fastify.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  // 404 handler
  fastify.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      error: 'Not Found',
      message: `Route ${request.method} ${request.url} tidak ditemukan`,
    })
  })

  // Error handler
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error)

    if (error.validation) {
      return reply.code(400).send({
        error: 'Validation Error',
        message: 'Validasi data gagal',
        details: error.validation,
      })
    }

    if (error.code === 'FST_JWT_AUTHORIZATION_FAILED') {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Token tidak valid',
      })
    }

    return reply.code(500).send({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Terjadi kesalahan pada server',
    })
  })

  return fastify
}
