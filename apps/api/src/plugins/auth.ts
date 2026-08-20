import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import fp from 'fastify-plugin'

export interface JwtPayload {
  userId: string
  username: string
  role: string
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload
  }
}

export default fp(async function (fastify: FastifyInstance) {
  fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized', message: 'Token tidak valid atau kadaluarsa' })
    }
  })

  fastify.decorate('authorize', function (roles: string[]) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized', message: 'User belum login' })
      }

      if (!roles.includes(request.user.role)) {
        return reply.code(403).send({ 
          error: 'Forbidden', 
          message: 'Anda tidak memiliki akses ke fitur ini' 
        })
      }
    }
  })
})
